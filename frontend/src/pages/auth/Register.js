import React, { useContext, useState } from 'react';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import AuthContext from '../../contexts/AuthContext';

const Register = () => {
  const { register } = useContext(AuthContext);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Nama harus diisi'),
    email: Yup.string()
      .email('Email tidak valid')
      .required('Email harus diisi'),
    password: Yup.string()
      .min(6, 'Password minimal 6 karakter')
      .required('Password harus diisi'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Password tidak cocok')
      .required('Konfirmasi password harus diisi'),
    store_name: Yup.string()
      .required('Nama toko harus diisi'),
    phone: Yup.string()
      .required('Nomor telepon harus diisi')
  });

  // Handle register
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError(null);
      
      // Remove confirmPassword from values
      const { confirmPassword, ...userData } = values;
      
      const result = await register(userData);
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h4 className="text-center mb-4">Daftar</h4>
      
      {error && (
        <Alert variant="danger">{error}</Alert>
      )}

      <Formik
        initialValues={{ 
          name: '', 
          email: '', 
          password: '', 
          confirmPassword: '', 
          store_name: '', 
          phone: '' 
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting
        }) => (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nama Lengkap</Form.Label>
              <Form.Control
                type="text"
                name="name"
                placeholder="Masukkan nama lengkap"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                isInvalid={touched.name && errors.name}
              />
              <Form.Control.Feedback type="invalid">
                {errors.name}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="Masukkan email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                isInvalid={touched.email && errors.email}
              />
              <Form.Control.Feedback type="invalid">
                {errors.email}
              </Form.Control.Feedback>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="Masukkan password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.password && errors.password}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Konfirmasi Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    placeholder="Konfirmasi password"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.confirmPassword && errors.confirmPassword}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.confirmPassword}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Nama Toko</Form.Label>
              <Form.Control
                type="text"
                name="store_name"
                placeholder="Masukkan nama toko"
                value={values.store_name}
                onChange={handleChange}
                onBlur={handleBlur}
                isInvalid={touched.store_name && errors.store_name}
              />
              <Form.Control.Feedback type="invalid">
                {errors.store_name}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Nomor Telepon</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                placeholder="Masukkan nomor telepon"
                value={values.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                isInvalid={touched.phone && errors.phone}
              />
              <Form.Control.Feedback type="invalid">
                {errors.phone}
              </Form.Control.Feedback>
            </Form.Group>

            <div className="d-grid mb-3">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Memproses...' : 'Daftar'}
              </Button>
            </div>
          </Form>
        )}
      </Formik>

      <div className="text-center mt-4">
        <p className="text-muted">
          Sudah memiliki akun? <Link to="/login" className="text-decoration-none">Masuk</Link>
        </p>
      </div>
    </>
  );
};

export default Register; 