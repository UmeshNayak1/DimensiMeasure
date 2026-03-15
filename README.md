# 📏 Real-Time Object Dimension Measurement System

A **Computer Vision based system** that measures the **real-world
dimensions of objects in real time using a camera**.\
This project uses **OpenCV and Machine Learning techniques** to detect
objects and estimate their width and height directly from images or live
webcam input.

The system demonstrates how **image processing, object detection, and
pixel-to-real-world scaling** can be used to automatically measure
object dimensions.

------------------------------------------------------------------------

# 🚀 Project Overview

Estimating the size of real-world objects using a camera is useful in
many industries such as:

-   📦 Logistics
-   🏭 Manufacturing
-   🤖 Robotics
-   🛒 E‑commerce
-   📏 Automated inspection systems

This project provides a **lightweight and efficient solution** that
detects objects and calculates their **dimensions in real time** using
computer vision.

------------------------------------------------------------------------

# ✨ Key Features

✔ Real-time object detection using webcam\
✔ Automatic edge and contour detection\
✔ Width and height measurement of objects\
✔ Pixel-to-real-world conversion for accurate measurement\
✔ Bounding box visualization\
✔ Works with both **images and live camera feed**

------------------------------------------------------------------------

# 🧠 How the System Works

The system follows a computer vision pipeline:

1️⃣ **Image Capture**\
The camera captures the input frame.

2️⃣ **Image Preprocessing**\
The image is converted to grayscale and blurred to remove noise.

3️⃣ **Edge Detection**\
Edges of objects are detected using OpenCV techniques.

4️⃣ **Contour Detection**\
Contours are extracted to identify the object's boundary.

5️⃣ **Reference Calibration**\
A reference object is used to calculate the **pixels-per-metric ratio**.

6️⃣ **Dimension Calculation**\
The width and height of the object are calculated using geometric
formulas.

7️⃣ **Visualization**\
The measured dimensions are displayed directly on the screen.

------------------------------------------------------------------------

# 🛠 Tech Stack

### Programming Language

-   Python

### Libraries

-   OpenCV
-   NumPy
-   imutils

### Tools

-   Webcam / Camera
-   VS Code / PyCharm
-   Git & GitHub

------------------------------------------------------------------------

# 📂 Project Structure

    Real-time-Object-Dimension-Measument-System
    │
    ├── measure_object_size.py
    ├── measure_object_size_camera.py
    ├── object_detector.py
    ├── images/
    │   └── sample images
    ├── output/
    │   └── measured results
    └── README.md

------------------------------------------------------------------------

# ⚙️ Installation

### 1. Clone the Repository

``` bash
git clone https://github.com/UmeshNayak1/Real-time-Object-Dimension-Measument-System-.git
```

### 2. Navigate to Project Folder

``` bash
cd Real-time-Object-Dimension-Measument-System-
```

### 3. Install Dependencies

``` bash
pip install opencv-python numpy imutils
```

------------------------------------------------------------------------

# ▶️ Usage

### Run with Webcam

``` bash
python measure_object_size_camera.py
```

### Run with Image

``` bash
python measure_object_size.py
```

The system will detect the object and display **width and height
measurements** on the screen.

------------------------------------------------------------------------

# 📊 Applications

-   📦 Product dimension measurement for e‑commerce
-   🏭 Industrial quality control
-   🤖 Robotics and automation
-   🚚 Logistics and packaging systems
-   🎓 Computer vision research and education

------------------------------------------------------------------------

# 🔮 Future Improvements

-   Improve measurement accuracy using calibration
-   Integrate **deep learning object detection (YOLO)**
-   Support multiple objects measurement
-   Build a **GUI interface**
-   Convert the system into a **web application**

------------------------------------------------------------------------

# 📸 Example Output

Detected objects will display:

    Width: XX cm
    Height: XX cm

Bounding boxes and measurements are drawn directly on the object.



⭐ If you found this project useful, consider **starring the
repository**!
