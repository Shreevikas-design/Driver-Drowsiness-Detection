# Driver Drowsiness Detection System

A real-time **Driver Drowsiness Detection System** developed using **C++, OpenCV, and Dlib**.
This system monitors the driver's eyes using a webcam and detects fatigue by calculating the **Eye Aspect Ratio (EAR)** from facial landmarks.

If the driver's eyes remain closed for a certain number of frames, the system detects drowsiness and triggers a warning alert.

---

## Project Overview

Driver fatigue is one of the major causes of road accidents. This project implements a computer vision–based system that continuously monitors the driver's eye movements and detects drowsiness in real time.

The system uses **facial landmark detection** to track the eye region and calculates the **Eye Aspect Ratio (EAR)** to determine whether the driver's eyes are open or closed.

---

## Features

• Real-time driver monitoring using webcam
• Facial landmark detection using Dlib
• Eye Aspect Ratio (EAR) based drowsiness detection
• Real-time video processing using OpenCV
• Visual alert when driver becomes drowsy

---

## Technologies Used

* **C++**
* **OpenCV**
* **Dlib**
* **CMake**
* **Computer Vision**

---

## Algorithm Used

The system calculates the **Eye Aspect Ratio (EAR)** using six eye landmark points.

EAR Formula:

EAR = (||p2 − p6|| + ||p3 − p5||) / (2 × ||p1 − p4||)

Where p1–p6 represent the eye landmark coordinates.

If the EAR value drops below a predefined threshold for several consecutive frames, the system classifies the driver as **drowsy**.

---

## Project Structure

Driver-Drowsiness-Detection

├── src
│   ├── main.cpp
│   ├── DrowsinessEngine.cpp
│   ├── LandmarkDetector.cpp
│   └── EARCalculator.cpp

├── include
│   ├── DrowsinessEngine.h
│   ├── LandmarkDetector.h
│   └── EARCalculator.h

├── models

├── CMakeLists.txt
├── README.md
└── .gitignore

---

## Installation

### 1. Install OpenCV

Download and install OpenCV from:
https://opencv.org/

---

### 2. Install Dlib

Download and install Dlib from:
http://dlib.net/

---

### 3. Download Facial Landmark Model

Download the pretrained facial landmark model:

http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2

Steps:

1. Download the file
2. Extract it
3. Place `shape_predictor_68_face_landmarks.dat` inside the **models** folder

---

## Build Instructions

Open terminal in the project folder and run:

mkdir build
cd build
cmake ..
make

---

## Run the Program

Run the executable:

./DrowsinessDetection

The webcam will start and the system will begin monitoring the driver's eyes.

---

## Applications

• Driver safety systems
• Smart vehicle monitoring
• Transportation safety systems
• Fatigue monitoring systems

---

## Future Improvements

• Add audio alarm when driver becomes drowsy
• Improve accuracy using deep learning models
• Mobile app integration
• Cloud-based driver monitoring

---

## Author

**A H Shree Vikas**
Electronics and Communication Engineering
BMS College of Engineering

---

## License

This project is for educational and research purposes.
