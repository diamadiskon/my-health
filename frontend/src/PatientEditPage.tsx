'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    TextField,
    CircularProgress,
    Grid,
    Input,
    List,
    ListItem,
    ListItemText,
    IconButton,
} from '@mui/material'
import { Delete as DeleteIcon, Upload as UploadIcon } from '@mui/icons-material'

interface PatientData {
    id: number
    username: string
    name: string
    surname: string
    dateOfBirth: string
    age: number
    address: string
    medicalRecord: string
    documents: string[]
}

export default function PatientEditPage() {
    const { patientId } = useParams<{ patientId: string }>()
    const navigate = useNavigate()
    const [patientData, setPatientData] = useState<PatientData | null>({
        id: 0,
        username: '',
        surname: '',
        name: '',
        age: 0,
        dateOfBirth: '',
        address: '',
        medicalRecord: '',
        documents: []
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    useEffect(() => {
        fetchPatientData()
    }, [patientId])

    const fetchPatientData = async () => {
        setLoading(true)
        setError(null)
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(`http://localhost:8080/patient/${patientId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setPatientData({
                ...response.data,
                documents: response.data.documents || []  // Ensure documents is always an array
            })
        } catch (error) {
            console.error('Failed to fetch patient data:', error)
            setError('Failed to fetch patient data. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setPatientData(prev => ({ ...prev!, [name]: value }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) return

        const formData = new FormData()
        formData.append('file', selectedFile)

        try {
            const token = localStorage.getItem('token')
            await axios.post(`http://localhost:8080/patient/${patientId}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            })
            fetchPatientData() // Refresh patient data to show new document
            setSelectedFile(null)
        } catch (error) {
            console.error('Failed to upload file:', error)
            setError('Failed to upload file. Please try again.')
        }
    }

    const handleDeleteDocument = async (documentName: string) => {
        try {
            const token = localStorage.getItem('token')
            await axios.delete(`http://localhost:8080/patient/${patientId}/document/${documentName}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            fetchPatientData() // Refresh patient data to remove deleted document
        } catch (error) {
            console.error('Failed to delete document:', error)
            setError('Failed to delete document. Please try again.')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem('token')
            await axios.post(`http://localhost:8080/patient/edit/${patientId}`, patientData, {
                headers: { Authorization: `Bearer ${token}` },
            })
            navigate(`/patient/${patientId}`)
        } catch (error) {
            console.error('Failed to update patient data:', error)
            setError('Failed to update patient data. Please try again.')
        }
    }



    const calculateAge = (dateOfBirth: string): number => {
        const today = new Date()
        const birthDate = new Date(dateOfBirth)
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDifference = today.getMonth() - birthDate.getMonth()
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        return age
    }

    const handleBack = () => {
        navigate(-1)
    }

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Container>
        )
    }

    if (error) {
        return (
            <Container>
                <Typography color="error">{error}</Typography>
                <Button onClick={handleBack}>Go Back</Button>
            </Container>
        )
    }

    return (
        <Container component="main" maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={6} sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                {/* ... (other parts of the JSX remain unchanged) */}
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* ... (other form fields remain unchanged) */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Date of Birth"
                                name="dateOfBirth"
                                type="date"
                                value={patientData?.dateOfBirth}
                                onChange={handleInputChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Age"
                                name="age"
                                type="number"
                                value={patientData?.age}
                                InputProps={{ readOnly: true }}
                            />
                        </Grid>
                        {/* ... (other form fields remain unchanged) */}
                    </Grid>
                    <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }}>
                        Save Changes
                    </Button>
                </form>
            </Paper>
        </Container>
    )
}
