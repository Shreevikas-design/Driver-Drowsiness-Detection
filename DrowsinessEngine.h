#ifndef DROWSINESS_ENGINE_H
#define DROWSINESS_ENGINE_H

#include <opencv2/opencv.hpp>
#include <thread>
#include <atomic>
#include <mutex>

#include "LandmarkDetector.h"
#include "EARCalculator.h"

struct DrowsinessState
{
    double ear;
    bool isDrowsy;
};

class DrowsinessEngine
{
public:
    DrowsinessEngine(const std::string &modelPath);
    ~DrowsinessEngine();

    void start();
    void stop();

    DrowsinessState getState();
    cv::Mat getFrame(); // optional (for GUI / web streaming)

private:
    void processingLoop();

    // Core components
    LandmarkDetector detector;
    EARCalculator earCalculator;
    cv::VideoCapture cap;

    // Threading
    std::thread worker;
    std::atomic<bool> running;

    // State
    std::mutex stateMutex;
    DrowsinessState currentState;

    // Frame
    std::mutex frameMutex;
    cv::Mat latestFrame;

    // Drowsiness logic
    std::deque<double> earBuffer;
    int drowsyCounter;
    int awakeCounter;
    bool isDrowsy;

    // Constants
    const double OPEN_EAR = 0.26;
    const double CLOSE_EAR = 0.22;
    const int BUFFER_SIZE = 15;
    const int DROWSY_CONFIRM = 25;
    const int AWAKE_CONFIRM = 15;
};

#endif
