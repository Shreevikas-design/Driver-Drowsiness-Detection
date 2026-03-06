#ifndef EAR_CALCULATOR_H
#define EAR_CALCULATOR_H

#include <vector>
#include <opencv2/core.hpp>

class EARCalculator
{
public:
    double computeEAR(const std::vector<cv::Point> &eyeLandmarks);

private:
    double euclideanDistance(const cv::Point &p1, const cv::Point &p2);
};

#endif

