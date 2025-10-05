"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building, Plus, Edit, Trash2, Search, UserPlus } from "lucide-react";
import { Airline, User } from "@/types";
import { airlineApi, userApi } from "@/lib/api";

interface AirlineForm {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  managerId?: string;
}

interface ManagerForm {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

export function AirlineManagement() {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isManagerDialogOpen, setIsManagerDialogOpen] = useState(false);
  const [editingAirline, setEditingAirline] = useState<Airline | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Helper function to safely format dates
  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  };
  const [formData, setFormData] = useState<AirlineForm>({
    name: "",
    code: "",
    description: "",
    isActive: true,
    managerId: "",
  });
  const [managerForm, setManagerForm] = useState<ManagerForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [airlinesResponse, managersResponse] = await Promise.all([
        airlineApi.getAllAirlines(),
        userApi.getCompanyManagers(),
      ]);

      if (airlinesResponse.success && airlinesResponse.data) {
        setAirlines(airlinesResponse.data);
      }
      if (managersResponse.success && managersResponse.data) {
        console.log("Fetched managers:", managersResponse.data);
        setManagers(managersResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingAirline) {
        const response = await airlineApi.updateAirline(editingAirline.id, formData);
        if (response.success) {
          if (formData.managerId) {
            await airlineApi.assignManager(editingAirline.id, formData.managerId);
          }
          await fetchData();
          resetForm();
        }
      } else {
        const response = await airlineApi.createAirline(formData);
        if (response.success && response.data) {
          if (formData.managerId) {
            await airlineApi.assignManager(response.data.id, formData.managerId);
          }
          await fetchData();
          resetForm();
        }
      }
    } catch (error) {
      console.error("Failed to save airline:", error);
    }
  };

  const handleEdit = (airline: Airline) => {
    setEditingAirline(airline);
    setFormData({
      name: airline.name || "",
      code: airline.code || "",
      description: airline.description || "",
      isActive: airline.isActive !== undefined ? airline.isActive : true,
      managerId: airline.managerId || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (airlineId: string) => {
    if (confirm("Are you sure you want to delete this airline? This action cannot be undone.")) {
      try {
        const response = await airlineApi.deleteAirline(airlineId);
        if (response.success) {
          await fetchData();
        }
      } catch (error) {
        console.error("Failed to delete airline:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      isActive: true,
      managerId: "",
    });
    setEditingAirline(null);
    setIsDialogOpen(false);
  };

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userData = {
        ...managerForm,
        role: "company_manager" as const,
        isBlocked: false,
      };
      const response = await userApi.createUser(userData);
      if (response.success) {
        await fetchData(); // Refresh both airlines and managers
        resetManagerForm();
      }
    } catch (error) {
      console.error("Failed to create manager:", error);
    }
  };

  const resetManagerForm = () => {
    setManagerForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
    });
    setIsManagerDialogOpen(false);
  };

  const filteredAirlines = airlines.filter(
    (airline) =>
      airline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      airline.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getManagerName = (managerId?: string) => {
    if (!managerId) return "Unassigned";
    const manager = managers.find((m) => m.id === managerId);
    return manager ? `${manager.firstName} ${manager.lastName}` : "Unknown";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Airline Management</h2>
          <p className="text-muted-foreground">Add airline companies and assign managers</p>
        </div>
        <div className="flex gap-2">
          {/* Create Manager Dialog */}
          <Dialog open={isManagerDialogOpen} onOpenChange={setIsManagerDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => resetManagerForm()}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Manager
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Create Company Manager</DialogTitle>
                <DialogDescription>Create a new company manager account to assign to airlines.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateManager} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manager-firstName">First Name</Label>
                    <Input
                      id="manager-firstName"
                      value={managerForm.firstName}
                      onChange={(e) => setManagerForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manager-lastName">Last Name</Label>
                    <Input
                      id="manager-lastName"
                      value={managerForm.lastName}
                      onChange={(e) => setManagerForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager-email">Email</Label>
                  <Input
                    id="manager-email"
                    type="email"
                    value={managerForm.email}
                    onChange={(e) => setManagerForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="john@airline.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager-phone">Phone (Optional)</Label>
                  <Input
                    id="manager-phone"
                    value={managerForm.phone || ""}
                    onChange={(e) => setManagerForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1234567890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager-password">Password</Label>
                  <Input
                    id="manager-password"
                    type="password"
                    value={managerForm.password}
                    onChange={(e) => setManagerForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                    required
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetManagerForm}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Manager</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Airline Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Airline
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingAirline ? "Edit Airline" : "Add New Airline"}</DialogTitle>
                <DialogDescription>
                  {editingAirline ? "Update the airline details below." : "Enter the details for the new airline."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Airline Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., American Airlines"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Airline Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="e.g., AA"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the airline"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager">Assign Manager</Label>
                  <Select
                    value={formData.managerId || "none"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, managerId: value === "none" ? "" : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a company manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No manager assigned</SelectItem>
                      {managers
                        .filter(
                          (manager) =>
                            manager.role === "company_manager" &&
                            (!manager.airlineId || manager.airlineId === editingAirline?.id)
                        )
                        .map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.firstName} {manager.lastName} ({manager.email})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingAirline ? "Update Airline" : "Add Airline"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search airlines by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Airlines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Airlines ({filteredAirlines.length})</CardTitle>
          <CardDescription>Manage all airline companies in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAirlines.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No airlines found</p>
              <p className="text-muted-foreground">Add your first airline to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Airline</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAirlines.map((airline) => (
                  <TableRow key={airline.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{airline.name}</div>
                        {airline.description && (
                          <div className="text-sm text-muted-foreground">{airline.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{airline.code}</Badge>
                    </TableCell>
                    <TableCell>{getManagerName(airline.managerId)}</TableCell>
                    <TableCell>
                      <Badge variant={airline.isActive !== false ? "default" : "secondary"}>
                        {airline.isActive !== false ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(airline.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(airline)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(airline.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
