import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Box, Container, Typography, Paper, Button,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Dialog,
    DialogActions, DialogContent, DialogTitle
} from '@mui/material';

interface AdminDashboardProps {
    adminId: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminId }) => {
    interface Patient {
        id: string;
        username: string;
    }

    const [patients, setPatients] = useState<Patient[]>([]);
    const [invitationId, setInvitationId] = useState('');
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchHouseholdPatients();
    }, []);

    const fetchHouseholdPatients = async () => {
        try {
            const response = await axios.get('/household/patients', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setPatients(response.data.patients);
        } catch (error) {
            console.error("Error fetching patients:", error);
        }
    };

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleCreateInvitation = async () => {
        try {
            const response = await axios.post('/create-invitation', {
                admin_id: adminId,
                patient_id: invitationId,
            });
            setMessage(response.data.success);
            handleClose();
            fetchHouseholdPatients(); // Refresh the list after invitation
        } catch (error) {
            console.error("Error creating invitation:", error);
            setMessage("Failed to create invitation");
        }
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Admin Dashboard
            </Typography>
            <Button variant="contained" color="primary" onClick={handleOpen}>
                Invite Patient
            </Button>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Invite a Patient</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Patient ID"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={invitationId}
                        onChange={(e) => setInvitationId(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleCreateInvitation}>Send Invitation</Button>
                </DialogActions>
            </Dialog>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Patient ID</TableCell>
                            <TableCell>Username</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {patients.map((patient) => (
                            <TableRow key={patient.id}>
                                <TableCell>{patient.id}</TableCell>
                                <TableCell>{patient.username}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {message && <Typography color="success.main">{message}</Typography>}
        </Container>
    );
};

export default AdminDashboard;
