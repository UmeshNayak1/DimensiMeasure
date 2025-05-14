# Object Dimension Tracker

A cutting-edge web application for precise object dimension measurement using advanced computer vision and machine learning technologies.

## Features

- **User Authentication**: Secure login and registration system
- **Dashboard**: View measurement statistics and recent activity
- **Upload Measurements**: Upload and process images to measure object dimensions
- **Real-time Measurements**: Use your camera for real-time object dimension measurement
- **Analytics**: Visualize measurement data with charts and statistics
- **Cross-Platform**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: React with TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with Passport.js
- **Computer Vision**: Custom Python model using OpenCV
- **Object Detection**: YOLO (You Only Look Once) object recognition
- **API Interface**: Flask RESTful API for the model server

## Getting Started

For detailed installation instructions, please refer to the [Installation Guide](INSTALL_GUIDE.md).

## Screenshots

### Dashboard
The dashboard provides an overview of your measurement statistics and recent activity.

### Upload Measurement
Upload images and get precise measurements of objects within them.

### Real-time Measurement
Use your camera to measure objects in real-time.

### Analytics
Visualize your measurement data with charts and graphs.

## System Architecture

The application consists of three main components:

1. **React Frontend**: Provides the user interface and handles client-side logic
2. **Node.js Backend**: Manages authentication, data storage, and communicates with the model server
3. **Python Model Server**: Processes images and performs object detection and measurement

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- YOLO object detection
- OpenCV for image processing
- TensorFlow/PyTorch for advanced machine learning capabilities
