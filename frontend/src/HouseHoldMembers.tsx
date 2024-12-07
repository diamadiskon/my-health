import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Container,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    TextField,
} from '@mui/material';

interface Patient {
    id: number;
    name: string;
    age: number;
    // add any other patient fields here
}

const HouseholdMembers = ({ adminId }: { adminId: string }) => {
    const [members, setMembers] = useState<Patient[]>([]);
    const [newMemberName, setNewMemberName] = useState('');

    useEffect(() => {
        // Fetch household members
        fetch(`/households/${adminId}`)
            .then((response) => response.json())
            .then((data) => setMembers(data))
            .catch((error) => console.error('Error fetching members:', error));
    }, [adminId]);

    const addHouseholdMember = () => {
        fetch(`/households/${adminId}/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: newMemberName }),
        })
            .then((response) => response.json())
            .then((newMember) => {
                setMembers((prevMembers) => [...prevMembers, newMember]);
                setNewMemberName('');
            })
            .catch((error) => console.error('Error adding member:', error));
    };

    return (
        <Container component="main" maxWidth="sm">
            <Paper elevation={6} sx={{ p: 4 }}>
                <Typography component="h1" variant="h4" gutterBottom>
                    Household Members
                </Typography>

                <Box sx={{ mt: 2 }}>
                    <TextField
                        label="New Member Name"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={addHouseholdMember}
                        fullWidth
                        sx={{ mt: 1 }}
                    >
                        Add Member
                    </Button>
                </Box>

                <List sx={{ mt: 4 }}>
                    {members.map((member) => (
                        <ListItem key={member.id}>
                            <ListItemText primary={member.name} secondary={`Age: ${member.age}`} />
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Container>
    );
};

export default HouseholdMembers;
