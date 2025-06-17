import React, { useState, useContext } from 'react';
import { Card, Form, Button, Alert, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import AuthContext from '../../contexts/AuthContext';

const Profile = () => {
  const { currentUser, updateProfile, changePassword } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Validation schema for profile
  const profileSchema = Yup.object({
    name: Yup.string()
      .required('Nama harus diisi'),
    store_name: Yup.string()
      .required('Nama toko harus diisi'),
    phone: Yup.string()
      .required('Nomor telepon harus diisi'),
    address: Yup.string()
      .required('Alamat harus diisi'),
    city: Yup.string()
      .required('Kota harus diisi'),
    province: Yup.string()
      .required('Provinsi harus diisi'),
    postal_code: Yup.string()
      .required('Kode pos harus diisi')
  });

  // Validation schema for password
  const passwordSchema = Yup.object({
    current_password: Yup.string()
      .required('Password saat ini harus diisi'),
    new_password: Yup.string()
      .min(6, 'Password minimal 6 karakter')
      .required('Password baru harus diisi'),
    confirm_password: Yup.string()
      .oneOf([Yup.ref('new_password'), null], 'Password tidak cocok')
      .required('Konfirmasi password harus diisi')
  });

  // Handle profile update
  const handleProfileUpdate = async (values, { setSubmitting, setErrors }) => {
    try {
      setProfileSuccess(false);
      const result = await updateProfile(values);
      
      if (result.success) {
        setProfileSuccess(true);
        window.scrollTo(0, 0);
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error) {
      setErrors({ submit: 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (values, { setSubmitting, setErrors, resetForm }) => {
    try {
      setPasswordSuccess(false);
      const result = await changePassword(values.current_password, values.new_password);
      
      if (result.success) {
        setPasswordSuccess(true);
        resetForm();
        window.scrollTo(0, 0);
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error) {
      setErrors({ submit: 'Terjadi kesalahan. Silakan coba lagi.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <Alert variant="warning">
        Anda harus login untuk mengakses halaman ini.
      </Alert>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Profil Saya</h2>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="profile" title="Informasi Profil">
          {profileSuccess && (
            <Alert variant="success" className="mb-4">
              Profil berhasil diperbarui.
            </Alert>
          )}
          
          <Card className="shadow-sm">
            <Card.Body>
              <Formik
                initialValues={{
                  name: currentUser.name || '',
                  email: currentUser.email || '',
                  store_name: currentUser.store_name || '',
                  phone: currentUser.phone || '',
                  address: currentUser.address || '',
                  city: currentUser.city || '',
                  province: currentUser.province || '',
                  postal_code: currentUser.postal_code || ''
                }}
                validationSchema={profileSchema}
                onSubmit={handleProfileUpdate}
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
                    {errors.submit && (
                      <Alert variant="danger" className="mb-4">
                        {errors.submit}
                      </Alert>
                    )}
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nama Lengkap</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={values.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.name && errors.name}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.name}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={values.email}
                            disabled
                          />
                          <Form.Text className="text-muted">
                            Email tidak dapat diubah.
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nama Toko</Form.Label>
                          <Form.Control
                            type="text"
                            name="store_name"
                            value={values.store_name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.store_name && errors.store_name}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.store_name}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nomor Telepon</Form.Label>
                          <Form.Control
                            type="text"
                            name="phone"
                            value={values.phone}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.phone && errors.phone}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.phone}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Alamat</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="address"
                        value={values.address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.address && errors.address}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.address}
                      </Form.Control.Feedback>
                    </Form.Group>
                    
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Kota</Form.Label>
                          <Form.Control
                            type="text"
                            name="city"
                            value={values.city}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.city && errors.city}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.city}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Provinsi</Form.Label>
                          <Form.Control
                            type="text"
                            name="province"
                            value={values.province}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.province && errors.province}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.province}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Kode Pos</Form.Label>
                          <Form.Control
                            type="text"
                            name="postal_code"
                            value={values.postal_code}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.postal_code && errors.postal_code}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.postal_code}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <div className="d-grid mt-4">
                      <Button 
                        type="submit" 
                        variant="primary" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="password" title="Ubah Password">
          {passwordSuccess && (
            <Alert variant="success" className="mb-4">
              Password berhasil diubah.
            </Alert>
          )}
          
          <Card className="shadow-sm">
            <Card.Body>
              <Formik
                initialValues={{
                  current_password: '',
                  new_password: '',
                  confirm_password: ''
                }}
                validationSchema={passwordSchema}
                onSubmit={handlePasswordChange}
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
                    {errors.submit && (
                      <Alert variant="danger" className="mb-4">
                        {errors.submit}
                      </Alert>
                    )}
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Password Saat Ini</Form.Label>
                      <Form.Control
                        type="password"
                        name="current_password"
                        value={values.current_password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.current_password && errors.current_password}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.current_password}
                      </Form.Control.Feedback>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Password Baru</Form.Label>
                      <Form.Control
                        type="password"
                        name="new_password"
                        value={values.new_password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.new_password && errors.new_password}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.new_password}
                      </Form.Control.Feedback>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Konfirmasi Password Baru</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirm_password"
                        value={values.confirm_password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.confirm_password && errors.confirm_password}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.confirm_password}
                      </Form.Control.Feedback>
                    </Form.Group>
                    
                    <div className="d-grid mt-4">
                      <Button 
                        type="submit" 
                        variant="primary" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Menyimpan...' : 'Ubah Password'}
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default Profile; 