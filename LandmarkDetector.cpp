#include "LandmarkDetector.h"

LandmarkDetector::LandmarkDetector(const std::string &modelPath)
{
    faceDetector = dlib::get_frontal_face_detector();
    dlib::deserialize(modelPath) >> landmarkPredictor;
}

bool LandmarkDetector::detect(const cv::Mat &frame,
                              std::vector<cv::Point> &leftEye,
                              std::vector<cv::Point> &rightEye)
{
    dlib::cv_image<dlib::bgr_pixel> dlibImg(frame);
    std::vector<dlib::rectangle> faces = faceDetector(dlibImg);

    if (faces.empty())
        return false;

    dlib::full_object_detection shape = landmarkPredictor(dlibImg, faces[0]);

    leftEye.clear();
    rightEye.clear();

    for (int i = 36; i <= 41; i++)
        leftEye.push_back(cv::Point(shape.part(i).x(), shape.part(i).y()));

    for (int i = 42; i <= 47; i++)
        rightEye.push_back(cv::Point(shape.part(i).x(), shape.part(i).y()));

    return true;
}
