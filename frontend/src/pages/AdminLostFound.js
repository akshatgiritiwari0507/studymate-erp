import React, { useEffect, useState } from 'react';
import { Box, Button, IconButton, List, ListItem, Paper, Stack, TextField, Typography, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/client';

export default function AdminLostFound() {
  const [items, setItems] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [form, setForm] = useState({ itemName:'', location:'', status:'Lost', contactNumber:'', description:'' });

  const load = async ()=>{ try{ const r=await api.get('/admin/v2/lostfound'); setItems(r.data||[]);}catch{} };
  useEffect(()=>{ load(); },[]);

  const add = async (e)=>{
    e && e.preventDefault(); setStatusMsg('');
    if (!form.itemName.trim() || !form.location.trim() || !form.contactNumber.trim()) return;
    await api.post('/admin/v2/lostfound', form);
    setForm({ itemName:'', location:'', status:'Lost', contactNumber:'', description:'' });
    setStatusMsg('Item added');
    load();
  };

  const update = async (id, patch)=>{ setStatusMsg(''); await api.patch(`/admin/v2/lostfound/${id}`, patch); setStatusMsg('Item updated'); load(); };
  const removeItem = async (id)=>{ setStatusMsg(''); await api.delete(`/admin/v2/lostfound/${id}`); setStatusMsg('Item deleted'); load(); };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb:2 }}>Lost & Found</Typography>
      {statusMsg && <Typography color="primary" sx={{ mb:1 }}>{statusMsg}</Typography>}

      <Paper sx={{ p:2, mb:2 }}>
        <Typography variant="h6" sx={{ mb:1 }}>Add Item</Typography>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={1} component="form" onSubmit={add}>
          <TextField size="small" label="Item Name" value={form.itemName} onChange={e=>setForm(v=>({...v,itemName:e.target.value}))} required />
          <TextField size="small" label="Location" value={form.location} onChange={e=>setForm(v=>({...v,location:e.target.value}))} required />
          <TextField size="small" select label="Status" value={form.status} onChange={e=>setForm(v=>({...v,status:e.target.value}))} sx={{ minWidth: 180 }}>
            <MenuItem value="Lost">Lost</MenuItem>
            <MenuItem value="Found">Found</MenuItem>
          </TextField>
          <TextField size="small" label="Contact Number" value={form.contactNumber} onChange={e=>setForm(v=>({...v,contactNumber:e.target.value}))} required />
          <TextField size="small" label="Description" value={form.description} onChange={e=>setForm(v=>({...v,description:e.target.value}))} fullWidth />
          <Button type="submit" variant="contained">Add</Button>
        </Stack>
      </Paper>

      <Paper sx={{ p:2 }}>
        <Typography variant="h6" sx={{ mb:1 }}>Items</Typography>
        <List>
          {(items||[]).map(it => (
            <ListItem key={it._id}
              secondaryAction={<IconButton edge="end" onClick={()=>removeItem(it._id)}><DeleteIcon/></IconButton>}>
              <Stack spacing={1} sx={{ width:'100%' }}>
                <Stack direction={{ xs:'column', sm:'row' }} spacing={1}>
                  <TextField size="small" sx={{ minWidth: 180 }} label="Item Name" value={it.itemName||''} onChange={e=>update(it._id, { itemName: e.target.value })} />
                  <TextField size="small" sx={{ minWidth: 160 }} label="Location" value={it.location||''} onChange={e=>update(it._id, { location: e.target.value })} />
                  <TextField size="small" select sx={{ minWidth: 140 }} label="Status" value={it.status||'Lost'} onChange={e=>update(it._id, { status: e.target.value })}>
                    <MenuItem value="Lost">Lost</MenuItem>
                    <MenuItem value="Found">Found</MenuItem>
                  </TextField>
                  <TextField size="small" sx={{ minWidth: 160 }} label="Contact Number" value={it.contactNumber||''} onChange={e=>update(it._id, { contactNumber: e.target.value })} />
                </Stack>
                <TextField size="small" fullWidth label="Description" value={it.description||''} onChange={e=>update(it._id, { description: e.target.value })} />
              </Stack>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
