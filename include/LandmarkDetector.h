#ifndef LANDMARK_DETECTOR_H
#define LANDMARK_DETECTOR_H

#include <string>
#include <vector>

#include <opencv2/core.hpp>

#include <dlib/image_processing.h>
#include <dlib/image_processing/frontal_face_detector.h>
#include <dlib/opencv.h>

class LandmarkDetector
{
public:
    LandmarkDetector(const std::string &modelPath);

    bool detect(const cv::Mat &frame,
                std::vector<cv::Point> &leftEye,
                std::vector<cv::Point> &rightEye);

private:
    dlib::frontal_face_detector faceDetector;
    dlib::shape_predictor landmarkPredictor;
};

#endif
