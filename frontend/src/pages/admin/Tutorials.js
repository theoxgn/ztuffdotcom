import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faEye } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const Tutorials = () => {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    image: null,
    status: 'published'
  });
  const [imagePreview, setImagePreview] = useState('');

  // Fetch tutorials
  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/tutorials');
      // Pastikan tutorials selalu array
      setTutorials(Array.isArray(response.data.data.tutorials) ? response.data.data.tutorials : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching tutorials:', err);
      setError('Gagal memuat data tutorial. Silakan coba lagi nanti.');
      setTutorials([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle add tutorial button
  const handleAddTutorial = () => {
    setModalMode('add');
    setFormData({
      title: '',
      description: '',
      content: '',
      image: null,
      status: 'published'
    });
    setImagePreview('');
    setShowModal(true);
  };

  // Handle edit tutorial button
  const handleEditTutorial = (tutorial) => {
    setModalMode('edit');
    setSelectedTutorial(tutorial);
    setFormData({
      title: tutorial.title,
      description: tutorial.description || '',
      content: tutorial.content || '',
      image: null, // We don't set the existing image here
      status: tutorial.status
    });
    setImagePreview(tutorial.image || '');
    setShowModal(true);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create FormData object to handle file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('status', formData.status);
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      
      if (modalMode === 'add') {
        await axios.post('/api/admin/tutorials', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.put(`/api/admin/tutorials/${selectedTutorial.id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      setShowModal(false);
      fetchTutorials();
    } catch (err) {
      setError(`Gagal ${modalMode === 'add' ? 'menambahkan' : 'mengubah'} tutorial. Silakan coba lagi.`);
    }
  };

  // Handle delete tutorial
  const handleDeleteTutorial = async (tutorialId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus tutorial ini?')) {
      try {
        await axios.delete(`/api/admin/tutorials/${tutorialId}`);
        fetchTutorials();
      } catch (err) {
        setError('Gagal menghapus tutorial. Silakan coba lagi.');
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  if (loading && tutorials.length === 0) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Pengelolaan Tutorial</h2>
        <Button variant="primary" size="sm" className="px-3 py-2 fw-semibold" onClick={handleAddTutorial}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Tambah Tutorial
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Judul</th>
                <th>Deskripsi</th>
                <th>Tanggal Dibuat</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tutorials.map((tutorial) => (
                <tr key={tutorial.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <img 
                        src={tutorial.image || '/default.webp'} 
                        alt={tutorial.title} 
                        width="50" 
                        height="50" 
                        className="me-2 rounded"
                        style={{ objectFit: 'cover' }}
                      />
                      {tutorial.title}
                    </div>
                  </td>
                  <td>
                    {tutorial.description && tutorial.description.length > 100 
                      ? `${tutorial.description.substring(0, 100)}...` 
                      : tutorial.description || '-'}
                  </td>
                  <td>{formatDate(tutorial.created_at)}</td>
                  <td>
                    <span className={`badge bg-${
                      tutorial.status === 'published' ? 'success' : 
                      tutorial.status === 'draft' ? 'warning' : 'secondary'
                    }`}>
                      {tutorial.status === 'published' ? 'Dipublikasi' : 
                       tutorial.status === 'draft' ? 'Draft' : tutorial.status}
                    </span>
                  </td>
                  <td>
                    <Button 
                      variant="outline-info" 
                      size="sm" 
                      className="me-1 px-2 py-1"
                      style={{ width: '32px', height: '32px' }}
                      href={`/tutorials/${tutorial.id}`} 
                      target="_blank"
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="me-1 px-2 py-1"
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => handleEditTutorial(tutorial)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      className="px-2 py-1"
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => handleDeleteTutorial(tutorial.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </td>
                </tr>
              ))}
              {tutorials.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    Tidak ada tutorial yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Add/Edit Tutorial Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'add' ? 'Tambah Tutorial' : 'Edit Tutorial'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Judul Tutorial</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Deskripsi Singkat</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Konten</Form.Label>
              <Form.Control
                as="textarea"
                rows={10}
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
              />
              <Form.Text className="text-muted">
                Anda dapat menggunakan format Markdown untuk konten
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Gambar</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              <div className="mt-2">
                <img 
                  src={imagePreview || '/default.webp'} 
                  alt="Preview" 
                  style={{ maxHeight: '200px', maxWidth: '100%' }} 
                />
              </div>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="published">Publikasikan</option>
                <option value="draft">Simpan sebagai Draft</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" className="px-3 py-2 fw-semibold" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" className="px-3 py-2 fw-semibold" type="submit">
              {modalMode === 'add' ? 'Tambah' : 'Simpan'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Tutorials; 