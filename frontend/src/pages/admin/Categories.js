import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/categories');
      // Pastikan categories selalu array
      setCategories(Array.isArray(response.data.data.categories) ? response.data.data.categories : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Gagal memuat data kategori. Silakan coba lagi nanti.');
      setCategories([]); // Set empty array on error
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
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('File harus berupa gambar (JPEG, PNG, atau WebP)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB');
        return;
      }
      
      setImageFile(file);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle add category button
  const handleAddCategory = () => {
    setModalMode('add');
    setFormData({
      name: '',
      description: '',
      status: 'active'
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  // Handle edit category button
  const handleEditCategory = (category) => {
    setModalMode('edit');
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      status: category.status
    });
    setImageFile(null);
    setImagePreview(category.image ? (
      category.image.includes('uploads/') 
        ? `${process.env.REACT_APP_API_URL}/${category.image}` 
        : `${process.env.REACT_APP_API_URL}/uploads/categories/${category.image}`
    ) : null);
    setShowModal(true);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('status', formData.status);
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }
      
      if (modalMode === 'add') {
        await axios.post('/api/admin/categories', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.put(`/api/admin/categories/${selectedCategory.id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      setError(`Gagal ${modalMode === 'add' ? 'menambahkan' : 'mengubah'} kategori. Silakan coba lagi.`);
    }
  };

  // Handle delete category
  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      try {
        await axios.delete(`/api/admin/categories/${categoryId}`);
        fetchCategories();
      } catch (err) {
        setError('Gagal menghapus kategori. Silakan coba lagi.');
      }
    }
  };

  if (loading && categories.length === 0) {
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
        <h2>Pengelolaan Kategori</h2>
        <Button variant="primary" size="sm" className="px-3 py-2 fw-semibold" onClick={handleAddCategory}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Tambah Kategori
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Gambar</th>
                <th>Nama</th>
                <th>Deskripsi</th>
                <th>Status</th>
                <th>Produk</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    {category.image ? (
                      <img 
                        src={category.image.includes('uploads/') 
                          ? `${process.env.REACT_APP_API_URL}/${category.image}` 
                          : `${process.env.REACT_APP_API_URL}/uploads/categories/${category.image}`
                        } 
                        alt={category.name} 
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        className="rounded"
                      />
                    ) : (
                      <div 
                        style={{ width: '50px', height: '50px' }}
                        className="bg-light border rounded d-flex align-items-center justify-content-center"
                      >
                        <small className="text-muted">No Image</small>
                      </div>
                    )}
                  </td>
                  <td>{category.name}</td>
                  <td>{category.description || '-'}</td>
                  <td>
                    <span className={`badge bg-${category.is_active === true ? 'success' : 'secondary'}`}>
                      {category.is_active === true ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td>{category.product_count || 0}</td>
                  <td>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="me-2 px-2 py-1"
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => handleEditCategory(category)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      className="px-2 py-1"
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Tidak ada kategori yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Add/Edit Category Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'add' ? 'Tambah Kategori' : 'Edit Kategori'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nama Kategori</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Deskripsi</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Gambar Kategori</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <div className="mt-2">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                    className="rounded"
                  />
                </div>
              )}
              <Form.Text className="text-muted">
                Format: JPG, PNG, GIF. Maksimal 5MB.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Aktif</option>
                <option value="inactive">Tidak Aktif</option>
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

export default Categories; 