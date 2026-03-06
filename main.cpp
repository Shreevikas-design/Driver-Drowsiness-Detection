#include <opencv2/opencv.hpp>
#include <dlib/opencv.h>
#include <dlib/image_processing/frontal_face_detector.h>
#include <dlib/image_processing.h>

#include <iostream>
#include <fstream>
#include <vector>
#include <numeric>
#include <chrono>

// ================= CONFIG =================
const std::string MODEL_PATH =
    "models/shape_predictor_68_face_landmarks.dat";

const std::string JSON_PATH =
    "status.json";

const double EAR_SLEEP = 0.23;
const double EAR_WAKE = 0.27;
const int REQUIRED_FRAMES = 25;
const int SKIP_FRAMES = 2;
// ==========================================

// ================= DRIVER STATE =================
enum class DriverState
{
    AWAKE,
    DROWSY
};
// ===============================================

// ================= EAR FUNCTION =================
double computeEAR(const std::vector<cv::Point> &eye)
{
    double A = cv::norm(eye[1] - eye[5]);
    double B = cv::norm(eye[2] - eye[4]);
    double C = cv::norm(eye[0] - eye[3]);
    return (A + B) / (2.0 * C);
}
// ===============================================

// ================= WRITE JSON ===================
void writeJSON(double ear, DriverState state)
{
    using namespace std::chrono;

    long long timestamp =
        duration_cast<seconds>(
            system_clock::now().time_since_epoch())
            .count();

    std::ofstream file(JSON_PATH, std::ios::trunc);
    if (!file.is_open())
    {
        std::cerr << "❌ Failed to write status.json\n";
        return;
    }

    file << "{\n";
    file << "  \"ear\": " << ear << ",\n";
    file << "  \"state\": \""
         << (state == DriverState::DROWSY ? "DROWSY" : "AWAKE")
         << "\",\n";
    file << "  \"timestamp\": " << timestamp << "\n";
    file << "}\n";

    file.close();
}
// ===============================================

int main()
{
    // ============ CAMERA ============
    cv::VideoCapture cap(0);
    if (!cap.isOpened())
    {
        std::cerr << "❌ Camera not opened\n";
        return -1;
    }

    cap.set(cv::CAP_PROP_FRAME_WIDTH, 640);
    cap.set(cv::CAP_PROP_FRAME_HEIGHT, 480);

    std::cout << "✅ Camera opened. Press ESC to exit.\n";

    // ============ DLIB ============
    dlib::frontal_face_detector faceDetector =
        dlib::get_frontal_face_detector();

    dlib::shape_predictor landmarkDetector;
    dlib::deserialize(MODEL_PATH) >> landmarkDetector;

    // ============ STATE ============
    DriverState state = DriverState::AWAKE;
    int closedEyeFrames = 0;

    double smoothEAR = 0.0;
    const double SMOOTH_ALPHA = 0.9;

    cv::Mat frame;
    int frameCount = 0;

    // ============ MAIN LOOP ============
    while (true)
    {
        cap >> frame;
        if (frame.empty())
            break;

        frameCount++;
        if (frameCount % SKIP_FRAMES != 0)
        {
            cv::imshow("Drowsiness Detection", frame);
            if (cv::waitKey(1) == 27)
                break;
            continue;
        }

        dlib::cv_image<dlib::bgr_pixel> dlibImg(frame);
        auto faces = faceDetector(dlibImg);

        if (!faces.empty())
        {
            dlib::full_object_detection shape =
                landmarkDetector(dlibImg, faces[0]);

            std::vector<cv::Point> leftEye, rightEye;

            for (int i = 36; i <= 41; i++)
                leftEye.emplace_back(shape.part(i).x(), shape.part(i).y());

            for (int i = 42; i <= 47; i++)
                rightEye.emplace_back(shape.part(i).x(), shape.part(i).y());

            // Draw landmarks
            for (int i = 36; i <= 47; i++)
            {
                cv::circle(frame,
                           cv::Point(shape.part(i).x(), shape.part(i).y()),
                           2, cv::Scalar(0, 255, 0), -1);
            }

            double ear =
                (computeEAR(leftEye) + computeEAR(rightEye)) / 2.0;

            // ---------- Smooth EAR ----------
            if (smoothEAR == 0.0)
                smoothEAR = ear;
            else
                smoothEAR = SMOOTH_ALPHA * smoothEAR +
                            (1.0 - SMOOTH_ALPHA) * ear;

            // ---------- State Machine ----------
            if (smoothEAR < EAR_SLEEP)
            {
                closedEyeFrames++;
            }
            else if (smoothEAR > EAR_WAKE)
            {
                closedEyeFrames = 0;
                state = DriverState::AWAKE;
            }

            if (closedEyeFrames >= REQUIRED_FRAMES)
            {
                state = DriverState::DROWSY;
            }

            // ---------- UI ----------
            cv::putText(frame,
                        "EAR: " + std::to_string(smoothEAR),
                        {20, 40},
                        cv::FONT_HERSHEY_SIMPLEX,
                        0.8, cv::Scalar(0, 255, 0), 2);

            if (state == DriverState::DROWSY)
            {
                cv::putText(frame,
                            "DROWSINESS ALERT!",
                            {80, 100},
                            cv::FONT_HERSHEY_SIMPLEX,
                            1.2, cv::Scalar(0, 0, 255), 3);
            }

            // ---------- WRITE JSON ----------
            writeJSON(smoothEAR, state);
        }

        cv::imshow("Drowsiness Detection", frame);
        if (cv::waitKey(1) == 27)
            break;
    }

    cap.release();
    cv::destroyAllWindows();
    return 0;
}
