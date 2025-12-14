import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, UserPlus, Edit, Trash2, Lock, Unlock } from 'lucide-react';
import { User } from '@/types';
import { getStoredUsers } from '@/lib/storage';
import { saveActivityLog } from '@/lib/shiftStorage';

export default function AdminUserManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'cashier' as 'admin' | 'cashier',
    isActive: true,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Load users from localStorage
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const storedUsers = getStoredUsers();
    setUsers(storedUsers);
  };

  const saveUsers = (updatedUsers: User[]) => {
    localStorage.setItem('dimsum_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const validateForm = (isEdit: boolean = false): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Nama minimal 3 karakter';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username wajib diisi';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username minimal 3 karakter';
    }

    // Check for duplicate username (skip current user when editing)
    const isDuplicate = users.some(
      (u) =>
        u.username.toLowerCase() === formData.username.toLowerCase() &&
        (!isEdit || u.id !== selectedUser?.id)
    );
    if (isDuplicate) {
      newErrors.username = 'Username sudah digunakan';
    }

    if (!isEdit && !formData.password.trim()) {
      newErrors.password = 'Password wajib diisi';
    } else if (!isEdit && formData.password.length < 4) {
      newErrors.password = 'Password minimal 4 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = () => {
    if (!validateForm()) return;

    const newUser: User = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      username: formData.username.trim(),
      password: formData.password,
      role: formData.role,
      isActive: formData.isActive,
    };

    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);

    // Log activity
    if (user) {
      saveActivityLog({
        id: `log_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'Menambah pengguna baru',
        actionType: 'user_management',
        timestamp: Date.now(),
        date: new Date().toISOString(),
        details: `Menambah pengguna: ${newUser.name} (${newUser.username}) - Role: ${newUser.role}`,
      });
    }

    // Reset form and close dialog
    setFormData({ name: '', username: '', password: '', role: 'cashier', isActive: true });
    setErrors({});
    setIsAddDialogOpen(false);
  };

  const handleEditUser = () => {
    if (!selectedUser || !validateForm(true)) return;

    const updatedUsers = users.map((u) =>
      u.id === selectedUser.id
        ? {
            ...u,
            name: formData.name.trim(),
            username: formData.username.trim(),
            ...(formData.password ? { password: formData.password } : {}),
            role: formData.role,
            isActive: formData.isActive,
          }
        : u
    );

    saveUsers(updatedUsers);

    // Log activity
    if (user) {
      saveActivityLog({
        id: `log_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'Mengedit pengguna',
        actionType: 'user_management',
        timestamp: Date.now(),
        date: new Date().toISOString(),
        details: `Mengedit pengguna: ${formData.name} (${formData.username})`,
      });
    }

    // Reset form and close dialog
    setFormData({ name: '', username: '', password: '', role: 'cashier', isActive: true });
    setSelectedUser(null);
    setErrors({});
    setIsEditDialogOpen(false);
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;

    // Prevent deleting the last admin
    const adminCount = users.filter((u) => u.role === 'admin').length;
    if (selectedUser.role === 'admin' && adminCount <= 1) {
      alert('Tidak dapat menghapus admin terakhir!');
      return;
    }

    // Prevent deleting current user
    if (selectedUser.id === user?.id) {
      alert('Tidak dapat menghapus akun yang sedang digunakan!');
      return;
    }

    const updatedUsers = users.filter((u) => u.id !== selectedUser.id);
    saveUsers(updatedUsers);

    // Log activity
    if (user) {
      saveActivityLog({
        id: `log_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'Menghapus pengguna',
        actionType: 'user_management',
        timestamp: Date.now(),
        date: new Date().toISOString(),
        details: `Menghapus pengguna: ${selectedUser.name} (${selectedUser.username})`,
      });
    }

    setSelectedUser(null);
    setIsDeleteDialogOpen(false);
  };

  const handleToggleActive = (userToToggle: User) => {
    // Prevent deactivating the last admin
    const activeAdminCount = users.filter((u) => u.role === 'admin' && u.isActive).length;
    if (userToToggle.role === 'admin' && userToToggle.isActive && activeAdminCount <= 1) {
      alert('Tidak dapat menonaktifkan admin terakhir yang aktif!');
      return;
    }

    // Prevent deactivating current user
    if (userToToggle.id === user?.id) {
      alert('Tidak dapat menonaktifkan akun yang sedang digunakan!');
      return;
    }

    const updatedUsers = users.map((u) =>
      u.id === userToToggle.id ? { ...u, isActive: !u.isActive } : u
    );
    saveUsers(updatedUsers);

    // Log activity
    if (user) {
      saveActivityLog({
        id: `log_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: `${userToToggle.isActive ? 'Menonaktifkan' : 'Mengaktifkan'} pengguna`,
        actionType: 'user_management',
        timestamp: Date.now(),
        date: new Date().toISOString(),
        details: `${userToToggle.isActive ? 'Menonaktifkan' : 'Mengaktifkan'} pengguna: ${userToToggle.name}`,
      });
    }
  };

  const openAddDialog = () => {
    setFormData({ name: '', username: '', password: '', role: 'cashier', isActive: true });
    setErrors({});
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setFormData({
      name: userToEdit.name,
      username: userToEdit.username,
      password: '',
      role: userToEdit.role,
      isActive: userToEdit.isActive ?? true,
    });
    setErrors({});
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (userToDelete: User) => {
    setSelectedUser(userToDelete);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manajemen Pengguna</h1>
              <p className="text-gray-600 mt-1">Kelola pengguna sistem</p>
            </div>
          </div>
          <Button onClick={openAddDialog} className="gap-2 bg-orange-600 hover:bg-orange-700">
            <UserPlus className="h-4 w-4" />
            Tambah Pengguna
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Pengguna</CardDescription>
              <CardTitle className="text-3xl">{users.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Admin</CardDescription>
              <CardTitle className="text-3xl">
                {users.filter((u) => u.role === 'admin').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Kasir</CardDescription>
              <CardTitle className="text-3xl">
                {users.filter((u) => u.role === 'cashier').length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengguna</CardTitle>
            <CardDescription>Kelola akun pengguna sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      Belum ada pengguna
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((userItem) => (
                    <TableRow key={userItem.id}>
                      <TableCell className="font-medium">
                        {userItem.name}
                        {userItem.id === user?.id && (
                          <Badge variant="outline" className="ml-2">
                            Anda
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{userItem.username}</TableCell>
                      <TableCell>
                        <Badge variant={userItem.role === 'admin' ? 'default' : 'secondary'}>
                          {userItem.role === 'admin' ? 'Admin' : 'Kasir'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={userItem.isActive ? 'default' : 'destructive'}>
                          {userItem.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggleActive(userItem)}
                            title={userItem.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {userItem.isActive ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <Unlock className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(userItem)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(userItem)}
                            disabled={userItem.id === user?.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add User Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pengguna Baru</DialogTitle>
              <DialogDescription>
                Masukkan informasi pengguna baru yang akan ditambahkan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="add-name">Nama Lengkap</Label>
                <Input
                  id="add-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="add-username">Username</Label>
                <Input
                  id="add-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Masukkan username"
                />
                {errors.username && (
                  <p className="text-sm text-red-500 mt-1">{errors.username}</p>
                )}
              </div>
              <div>
                <Label htmlFor="add-password">Password</Label>
                <Input
                  id="add-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Masukkan password"
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
              </div>
              <div>
                <Label htmlFor="add-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'admin' | 'cashier') =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger id="add-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Kasir</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAddUser} className="bg-orange-600 hover:bg-orange-700">
                Tambah
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Pengguna</DialogTitle>
              <DialogDescription>
                Ubah informasi pengguna. Kosongkan password jika tidak ingin mengubahnya
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nama Lengkap</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Masukkan username"
                />
                {errors.username && (
                  <p className="text-sm text-red-500 mt-1">{errors.username}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-password">Password Baru (opsional)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Kosongkan jika tidak ingin mengubah"
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'admin' | 'cashier') =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Kasir</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleEditUser} className="bg-orange-600 hover:bg-orange-700">
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus pengguna "{selectedUser?.name}" ({selectedUser?.username})? Tindakan
                ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}