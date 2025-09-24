# Elder Health Monitoring Dashboard

A comprehensive Proof of Concept (POC) application for elder care and health monitoring, designed to bridge the gap between elderly patients and their healthcare providers/family caregivers through technology.

## What This POC Demonstrates

This application showcases a modern approach to elder care management with dual user roles:
- **Patient Interface**: Elderly individuals can manage their health profiles and view their data
- **Admin/Caregiver Interface**: Healthcare providers or family members can monitor and manage multiple patients

## Core Features

### 🏥 Patient Management System
- **User Registration & Authentication**: Secure account creation for both patients and admins
- **Role-based Access Control**: Separate dashboards for patients and healthcare providers
- **Patient Profiles**: Comprehensive medical information storage including:
  - Personal details (name, age, gender, blood type)
  - Emergency contact information
  - Medical history and current medications
  - Known allergies and medical conditions

### 📊 Real-time Health Monitoring
- **Interactive Health Metrics Dashboard**: Visualize health data through responsive charts
- **Multi-metric Tracking**:
  - Blood pressure (systolic/diastolic) with trend analysis
  - Heart rate monitoring with irregular rhythm detection
  - Weight tracking over time
  - Oxygen saturation (SpO2) levels
  - Daily step count and activity monitoring
  - Sleep pattern analysis (light, deep, REM sleep phases)
- **Live Data Refresh**: Real-time updates of health metrics
- **Fall Detection Alerts**: Safety monitoring capabilities

### 👨‍⚕️ Caregiver Dashboard
- **Household Management**: Admins can manage multiple patients in their care
- **Patient Invitation System**: Secure invitation-based patient onboarding
- **Comprehensive Patient Views**: Access detailed health information and trends
- **Multi-patient Oversight**: Monitor multiple elderly patients from a single interface

### 💡 Smart Health Insights
- **Trend Visualization**: Interactive charts showing health metric changes over time
- **Tabbed Interface**: Organized view of different health metrics
- **Current vs Historical Data**: Compare latest readings with historical trends
- **Health Status Indicators**: Visual cues for health metric ranges

## Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Material-UI (MUI)** for modern, accessible user interface
- **Recharts** for interactive health data visualization
- **React Router** for seamless navigation
- **Axios** for API communication

### Backend
- **Go (Golang)** with Gin web framework for high-performance API
- **PostgreSQL** database for reliable data storage
- **JWT Authentication** for secure user sessions
- **RESTful API** design for scalable communication

### Infrastructure
- **Docker Compose** for containerized development environment
- **Multi-container Architecture** with separate frontend, backend, and database services

## Getting Started

### Prerequisites
- Docker and Docker Compose installed
- Node.js and Yarn (for local frontend development)
- Go 1.19+ (for local backend development)

### Quick Start with Docker
```bash
# Clone the repository
git clone <repository-url>
cd my-health

# Start all services
docker-compose up

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
```

### Local Development
```bash
# Frontend development
cd frontend
npm install
npm start

# Backend development
cd backend
go mod tidy
go run main.go
```

## User Workflows

### For Patients (Elderly Users)
1. **Registration**: Create account or receive invitation from caregiver
2. **Profile Setup**: Complete medical information and emergency contacts
3. **Health Monitoring**: View personal health trends and current metrics
4. **ID Sharing**: Share patient ID with caregivers for household inclusion

### For Admins/Caregivers
1. **Dashboard Access**: Monitor all patients in household
2. **Patient Invitation**: Send invitations to new patients using their ID
3. **Health Oversight**: Review detailed health metrics and trends for each patient
4. **Profile Management**: Update and maintain patient information

## POC Capabilities Demonstrated

### Healthcare Technology Integration
- Seamless data flow between patients and healthcare providers
- Real-time health monitoring with historical trend analysis
- Multi-user household management for family caregivers

### User Experience Design
- Intuitive interface designed for elderly users
- Clear visual hierarchy and large, accessible UI elements
- Responsive design that works on various devices

### Data Security & Privacy
- JWT-based authentication system
- Role-based access control
- Secure patient data handling

### Scalability Architecture
- Containerized microservices approach
- RESTful API design for easy integration
- Database optimization for health metric storage

### Modern Web Technologies
- React-based SPA with TypeScript for reliability
- Material Design implementation for familiar UI patterns
- Real-time data visualization with interactive charts

## Future Enhancement Potential

This POC provides the foundation for:
- **IoT Integration**: Connect with wearable devices and health monitors
- **AI-powered Insights**: Predictive health analytics and early warning systems
- **Telemedicine Integration**: Video consultations and remote care capabilities
- **Mobile Applications**: Native iOS/Android apps for better accessibility
- **Advanced Analytics**: Machine learning for health pattern recognition
- **Emergency Response**: Automated alerts for critical health changes

## Technical Highlights

- **Type-safe Development**: Full TypeScript implementation for reduced bugs
- **Component-based Architecture**: Reusable React components for maintainability
- **Real-time Updates**: Efficient data synchronization between frontend and backend
- **Responsive Charts**: Interactive health data visualization with Recharts
- **Secure Authentication**: JWT-based session management
- **Database Optimization**: Efficient health metric storage and retrieval

This POC demonstrates how modern web technologies can be leveraged to create meaningful healthcare solutions that bridge the digital divide for elderly populations while providing powerful tools for their caregivers.