#include "DrowsinessEngine.h"
#include <algorithm>

DrowsinessEngine::DrowsinessEngine(const std::string &modelPath)
    : detector(modelPath), running(false),
      drowsyCounter(0), awakeCounter(0), isDrowsy(false)
{
    currentState = {0.0, false};
}

DrowsinessEngine::~DrowsinessEngine()
{
    stop();
}

void DrowsinessEngine::start()
{
    if (running)
        return;

    std::cout << "[ENGINE] Starting engine..." << std::endl;

    cap.open(0);
    if (!cap.isOpened())
    {
        std::cout << "[ENGINE] Camera FAILED to open!" << std::endl;
        return;
    }

    std::cout << "[ENGINE] Camera opened successfully" << std::endl;

    running = true;
    worker = std::thread(&DrowsinessEngine::processingLoop, this);
}

void DrowsinessEngine::stop()
{
    running = false;
    if (worker.joinable())
        worker.join();

    if (cap.isOpened())
        cap.release();
}

void DrowsinessEngine::processingLoop()
{
    while (running)
    {
        cv::Mat frame;
        cap >> frame;
        if (frame.empty())
        {
            std::cout << "[ENGINE] Empty frame!" << std::endl;
            continue;
        }

        {
            std::lock_guard<std::mutex> lock(frameMutex);
            latestFrame = frame.clone();
        }

        std::vector<cv::Point> leftEye, rightEye;
        bool found = detector.detect(frame, leftEye, rightEye);

        if (!found)
            continue;

        double leftEAR = earCalculator.computeEAR(leftEye);
        double rightEAR = earCalculator.computeEAR(rightEye);
        double rawEAR = (leftEAR + rightEAR) / 2.0;

        // Median filter
        earBuffer.push_back(rawEAR);
        if (earBuffer.size() > BUFFER_SIZE)
            earBuffer.pop_front();

        std::vector<double> temp(earBuffer.begin(), earBuffer.end());
        std::sort(temp.begin(), temp.end());
        double filteredEAR = temp[temp.size() / 2];

        // Hysteresis logic
        if (filteredEAR < CLOSE_EAR)
        {
            drowsyCounter++;
            awakeCounter = 0;
        }
        else if (filteredEAR > OPEN_EAR)
        {
            awakeCounter++;
            drowsyCounter = 0;
        }

        if (drowsyCounter > DROWSY_CONFIRM)
            isDrowsy = true;

        if (awakeCounter > AWAKE_CONFIRM)
            isDrowsy = false;

        {
            std::lock_guard<std::mutex> lock(stateMutex);
            currentState.ear = filteredEAR;
            currentState.isDrowsy = isDrowsy;
        }
    }
}

DrowsinessState DrowsinessEngine::getState()
{
    std::lock_guard<std::mutex> lock(stateMutex);
    return currentState;
}

cv::Mat DrowsinessEngine::getFrame()
{
    std::lock_guard<std::mutex> lock(frameMutex);
    return latestFrame.clone();
}
