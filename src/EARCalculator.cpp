#include "EARCalculator.h"
#include <cmath>

double EARCalculator::euclideanDistance(const cv::Point &p1, const cv::Point &p2)
{
    return std::sqrt((p1.x - p2.x) * (p1.x - p2.x) +
                     (p1.y - p2.y) * (p1.y - p2.y));
}

double EARCalculator::computeEAR(const std::vector<cv::Point> &eyeLandmarks)
{
    // EAR formula: (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
    double A = euclideanDistance(eyeLandmarks[1], eyeLandmarks[5]);
    double B = euclideanDistance(eyeLandmarks[2], eyeLandmarks[4]);
    double C = euclideanDistance(eyeLandmarks[0], eyeLandmarks[3]);

    return (A + B) / (2.0 * C);
}
