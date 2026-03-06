cmake_minimum_required(VERSION 3.15)
project(DrowsinessDetection)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# -------- OpenCV --------
set(OpenCV_DIR "C:/opencv/opencv/build/x64/vc16/lib")
find_package(OpenCV REQUIRED)

# -------- Dlib --------
set(DLIB_DIR "C:/dlib-20.0")
add_subdirectory(${DLIB_DIR} dlib_build)

# -------- Include Paths --------
include_directories(
    ${OpenCV_INCLUDE_DIRS}
    ${DLIB_DIR}
    ${CMAKE_SOURCE_DIR}/include
)

# -------- Source Files --------
add_executable(DrowsinessDetection
    src/main.cpp
    src/LandmarkDetector.cpp
    src/EARCalculator.cpp
    src/DrowsinessEngine.cpp

)

# -------- Link Libraries --------
target_link_libraries(DrowsinessDetection
    ${OpenCV_LIBS}
    dlib::dlib
)
