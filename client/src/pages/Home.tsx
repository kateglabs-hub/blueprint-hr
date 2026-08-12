import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, Users, ShieldCheck, Layers, FileText, Activity, Plus, 
  Briefcase, DollarSign, Calendar, CheckCircle2, AlertCircle, LogOut, UserCheck, Settings, Search
} from "lucide-react";
import { toast } from "sonner";
import { startLogin } from "@/_core/const";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("dashboard");

  // State for Employee creation dialog
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);
  const [empForm, setEmpForm] = useState({
    employeeNo: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    kraPin: "",
    nssfNo: "",
    shifNo: "",
    basicSalary: "85000",
    employmentStatus: "Active",
    departmentId: 1,
  });

  // State for Org Setup dialogs
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [branchLocation, setBranchLocation] = useState("");

  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [deptName, setDeptName] = useState("");

  const [isTenantOpen, setIsTenantOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [tenantKra, setTenantKra] = useState("");

  // Queries
  const { data: tenant } = trpc.tenant.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: employees = [], refetch: refetchEmployees } = trpc.employee.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: branches = [], refetch: refetchBranches } = trpc.org.branches.useQuery(undefined, { enabled: isAuthenticated });
  const { data: departments = [], refetch: refetchDepartments } = trpc.org.departments.useQuery(undefined, { enabled: isAuthenticated });
  const { data: designations = [] } = trpc.org.designations.useQuery(undefined, { enabled: isAuthenticated });
  const { data: grades = [] } = trpc.org.grades.useQuery(undefined, { enabled: isAuthenticated });
  const { data: employmentTypes = [] } = trpc.org.employmentTypes.useQuery(undefined, { enabled: isAuthenticated });
  const { data: auditLogs = [], refetch: refetchAudit } = trpc.audit.list.useQuery(undefined, { enabled: isAuthenticated && ["Super Admin", "Company Admin", "HR Manager", "admin"].includes(user?.role || "") });

  // Mutations
  const updateRoleMutation = trpc.auth.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully!");
      utils.auth.me.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const createEmployeeMutation = trpc.employee.create.useMutation({
    onSuccess: () => {
      toast.success("Employee master created successfully!");
      setIsEmployeeOpen(false);
      refetchEmployees();
      refetchAudit();
    },
    onError: (err) => toast.error(err.message),
  });

  const createBranchMutation = trpc.org.createBranch.useMutation({
    onSuccess: () => {
      toast.success("Branch created successfully!");
      setIsBranchOpen(false);
      setBranchName("");
      setBranchLocation("");
      refetchBranches();
      refetchAudit();
    },
    onError: (err) => toast.error(err.message),
  });

  const createDeptMutation = trpc.org.createDepartment.useMutation({
    onSuccess: () => {
      toast.success("Department created successfully!");
      setIsDeptOpen(false);
      setDeptName("");
      refetchDepartments();
      refetchAudit();
    },
    onError: (err) => toast.error(err.message),
  });

  const createTenantMutation = trpc.tenant.create.useMutation({
    onSuccess: () => {
      toast.success("Company registered successfully!");
      setIsTenantOpen(false);
      utils.tenant.get.invalidate();
      refetchAudit();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">BluePrint HR</h1>
            <p className="text-sm text-slate-400">Kenya-focused Multi-Tenant Payroll & HR Management SaaS Platform</p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-xl text-left text-xs text-slate-300 space-y-2 border border-slate-700/50">
            <p className="font-semibold text-blue-400">Phase 1 Enterprise Foundation:</p>
            <p>✓ Strict Tenant Isolation (tenantId)</p>
            <p>✓ 5 Roles: Super Admin, Company Admin, HR Manager, Payroll Manager, Employee</p>
            <p>✓ KRA PIN, NSSF Number, SHIF Number & Bank Details</p>
            <p>✓ Complete Audit Logs & Organization Structure</p>
          </div>
          <Button onClick={() => startLogin()} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20">
            Sign In with Manus OAuth
          </Button>
        </div>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    "Super Admin": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "Company Admin": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "HR Manager": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Payroll Manager": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Employee": "bg-slate-500/10 text-slate-300 border-slate-500/20",
    "admin": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "user": "bg-slate-500/10 text-slate-300 border-slate-500/20",
  };

  const totalPayroll = employees.reduce((acc, emp) => acc + Number(emp.basicSalary || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold shadow-md">
            BP
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight flex items-center gap-2">
              {tenant?.companyName || "BluePrint HR SaaS"} 
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30 font-normal">Kenya Compliance</Badge>
            </h1>
            <p className="text-xs text-slate-400">Tenant ID: {tenant?.id || 1} | KRA PIN: {tenant?.kraPin || "P051234567X"}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400">Role:</span>
            <Select 
              value={user?.role || "Employee"} 
              onValueChange={(val: any) => updateRoleMutation.mutate({ role: val })}
            >
              <SelectTrigger className="h-7 text-xs bg-slate-900 border-slate-700 text-blue-400 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                <SelectItem value="Super Admin">Super Admin</SelectItem>
                <SelectItem value="Company Admin">Company Admin</SelectItem>
                <SelectItem value="HR Manager">HR Manager</SelectItem>
                <SelectItem value="Payroll Manager">Payroll Manager</SelectItem>
                <SelectItem value="Employee">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
          </div>

          <Button variant="ghost" size="icon" onClick={() => logout()} className="text-slate-400 hover:text-red-400 hover:bg-slate-800">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex flex-wrap gap-1">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium transition-all">
              <Activity className="w-4 h-4 mr-2" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="employees" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium transition-all">
              <Users className="w-4 h-4 mr-2" /> Employee Master
            </TabsTrigger>
            <TabsTrigger value="organization" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium transition-all">
              <Layers className="w-4 h-4 mr-2" /> Organization
            </TabsTrigger>
            <TabsTrigger value="tenant" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium transition-all">
              <Building2 className="w-4 h-4 mr-2" /> Tenant & Company
            </TabsTrigger>
            {["Super Admin", "Company Admin", "HR Manager", "admin"].includes(user?.role || "") && (
              <TabsTrigger value="audit" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium transition-all">
                <ShieldCheck className="w-4 h-4 mr-2" /> Audit Trail
              </TabsTrigger>
            )}
          </TabsList>

          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-slate-900 border-slate-800 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Total Headcount</CardTitle>
                  <Users className="w-4 h-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{employees.length}</div>
                  <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active Tenant Scope
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Monthly Payroll (KES)</CardTitle>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">KES {totalPayroll.toLocaleString()}</div>
                  <p className="text-xs text-slate-400 mt-1">Pre-statutory gross sum</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Branches & Units</CardTitle>
                  <Building2 className="w-4 h-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{branches.length}</div>
                  <p className="text-xs text-slate-400 mt-1">{departments.length} Departments active</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Compliance Engine</CardTitle>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-400">Ready</div>
                  <p className="text-xs text-slate-400 mt-1">PAYE, NSSF, SHIF, Housing Levy</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-slate-900 border-slate-800 lg:col-span-2 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Welcome, {user?.name}</CardTitle>
                  <CardDescription className="text-slate-400">
                    Your current role is <span className="text-blue-400 font-medium">{user?.role}</span>. You have access to tenant-scoped HR operations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-3">
                    <h4 className="font-medium text-sm text-slate-200">Phase 1 Quick Actions</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button variant="outline" className="bg-slate-900 border-slate-700 hover:bg-slate-800 justify-start" onClick={() => setIsEmployeeOpen(true)}>
                        <Plus className="w-4 h-4 mr-2 text-blue-400" /> Register New Employee
                      </Button>
                      <Button variant="outline" className="bg-slate-900 border-slate-700 hover:bg-slate-800 justify-start" onClick={() => setActiveTab("organization")}>
                        <Layers className="w-4 h-4 mr-2 text-purple-400" /> Manage Org Structure
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-300">Recent Employee Records</h4>
                    <div className="border border-slate-800 rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-800/50">
                          <TableRow className="border-slate-800">
                            <TableHead className="text-slate-400">No.</TableHead>
                            <TableHead className="text-slate-400">Full Name</TableHead>
                            <TableHead className="text-slate-400">KRA PIN</TableHead>
                            <TableHead className="text-slate-400">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employees.slice(0, 5).map(emp => (
                            <TableRow key={emp.id} className="border-slate-800 hover:bg-slate-800/30">
                              <TableCell className="font-mono text-xs text-blue-400">{emp.employeeNo}</TableCell>
                              <TableCell className="font-medium">{emp.firstName} {emp.lastName}</TableCell>
                              <TableCell className="font-mono text-xs text-slate-400">{emp.kraPin}</TableCell>
                              TableCell>
                                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                  {emp.employmentStatus}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          {employees.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-slate-500 py-6">No employees registered yet.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Tenant Overview</CardTitle>
                  <CardDescription className="text-slate-400">Company configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400">Company Name</span>
                    <p className="font-medium text-slate-200">{tenant?.companyName || "BluePrint Kenya Ltd"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400">KRA PIN</span>
                    <p className="font-mono text-xs text-blue-400">{tenant?.kraPin || "P051234567X"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400">Official Email</span>
                    <p className="text-slate-200">{tenant?.email || "hr@blueprint.co.ke"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400">Phone Number</span>
                    <p className="text-slate-200">{tenant?.phone || "+254 712 345 678"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400">Physical Address</span>
                    <p className="text-slate-200">{tenant?.address || "Delta Towers, Westlands, Nairobi"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* EMPLOYEE MASTER TAB */}
          <TabsContent value="employees" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
              <div>
                <h2 className="text-xl font-bold">Employee Master</h2>
                <p className="text-sm text-slate-400">Manage employee profiles, statutory numbers (KRA PIN, NSSF, SHIF), and bank details.</p>
              </div>
              {["Super Admin", "Company Admin", "HR Manager", "admin"].includes(user?.role || "") && (
                <Button onClick={() => setIsEmployeeOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white shadow-md">
                  <Plus className="w-4 h-4 mr-2" /> Add Employee
                </Button>
              )}
            </div>

            <Card className="bg-slate-900 border-slate-800 shadow-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-800/50">
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Employee No</TableHead>
                    <TableHead className="text-slate-400">Full Name</TableHead>
                    <TableHead className="text-slate-400">KRA PIN</TableHead>
                    <TableHead className="text-slate-400">NSSF No</TableHead>
                    <TableHead className="text-slate-400">SHIF No</TableHead>
                    <TableHead className="text-slate-400">Basic Salary (KES)</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map(emp => (
                    <TableRow key={emp.id} className="border-slate-800 hover:bg-slate-800/30">
                      <TableCell className="font-mono text-xs text-blue-400">{emp.employeeNo}</TableCell>
                      <TableCell className="font-medium">{emp.firstName} {emp.middleName ? emp.middleName + ' ' : ''}{emp.lastName}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-300">{emp.kraPin}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">{emp.nssfNo || "N/A"}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">{emp.shifNo || "N/A"}</TableCell>
                      <TableCell className="font-semibold text-emerald-400">KES {Number(emp.basicSalary).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          {emp.employmentStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {employees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                        No employees found. Click "Add Employee" to create the first record.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ORGANIZATION STRUCTURE TAB */}
          <TabsContent value="organization" className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
              <div>
                <h2 className="text-xl font-bold">Organization Structure</h2>
                <p className="text-sm text-slate-400">Branches, departments, designations, salary grades, and employment types.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsBranchOpen(true)} className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                  <Plus className="w-4 h-4 mr-2 text-blue-400" /> Add Branch
                </Button>
                <Button variant="outline" onClick={() => setIsDeptOpen(true)} className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                  <Plus className="w-4 h-4 mr-2 text-purple-400" /> Add Department
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Branches */}
              <Card className="bg-slate-900 border-slate-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center justify-between">
                    Branches
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">{branches.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {branches.map(b => (
                    <div key={b.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{b.name}</p>
                        <p className="text-xs text-slate-400">{b.location || "Nairobi HQ"}</p>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">{b.code || "HQ"}</Badge>
                    </div>
                  ))}
                  {branches.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No branches defined.</p>}
                </CardContent>
              </Card>

              {/* Departments */}
              <Card className="bg-slate-900 border-slate-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center justify-between">
                    Departments
                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">{departments.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {departments.map(d => (
                    <div key={d.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{d.name}</p>
                        <p className="text-xs text-slate-400">Code: {d.code || "DEP"}</p>
                      </div>
                    </div>
                  ))}
                  {departments.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No departments defined.</p>}
                </CardContent>
              </Card>

              {/* Designations & Grades */}
              <Card className="bg-slate-900 border-slate-800 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center justify-between">
                    Designations & Grades
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{designations.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {designations.map(des => (
                    <div key={des.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 flex justify-between items-center">
                      <p className="font-medium text-sm">{des.name}</p>
                      <Badge variant="outline" className="text-xs">Active</Badge>
                    </div>
                  ))}
                  {designations.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No designations defined.</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TENANT SETUP TAB */}
          <TabsContent value="tenant" className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
              <div>
                <h2 className="text-xl font-bold">Tenant & Company Setup</h2>
                <p className="text-sm text-slate-400">Multi-tenant isolation and company profile parameters.</p>
              </div>
              {user?.role === "Super Admin" && (
                <Button onClick={() => setIsTenantOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white shadow-md">
                  <Plus className="w-4 h-4 mr-2" /> Register New Company
                </Button>
              )}
            </div>

            <Card className="bg-slate-900 border-slate-800 shadow-lg max-w-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Active Tenant Details</CardTitle>
                <CardDescription className="text-slate-400">Configured organization parameters for payroll & tax calculations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Company Name</Label>
                    <Input disabled value={tenant?.companyName || ""} className="bg-slate-800 border-slate-700" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">KRA PIN</Label>
                    <Input disabled value={tenant?.kraPin || ""} className="bg-slate-800 border-slate-700 font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Email Address</Label>
                    <Input disabled value={tenant?.email || ""} className="bg-slate-800 border-slate-700" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Phone</Label>
                    <Input disabled value={tenant?.phone || ""} className="bg-slate-800 border-slate-700" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Physical Address</Label>
                  <Input disabled value={tenant?.address || ""} className="bg-slate-800 border-slate-700" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AUDIT LOG TAB */}
          {["Super Admin", "Company Admin", "HR Manager", "admin"].includes(user?.role || "") && (
            <TabsContent value="audit" className="space-y-6">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
                <h2 className="text-xl font-bold">Audit Trail</h2>
                <p className="text-sm text-slate-400">Tracks all create, update, and delete actions across tenant data.</p>
              </div>

              <Card className="bg-slate-900 border-slate-800 shadow-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-800/50">
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Timestamp</TableHead>
                      <TableHead className="text-slate-400">User</TableHead>
                      <TableHead className="text-slate-400">Action</TableHead>
                      <TableHead className="text-slate-400">Entity</TableHead>
                      <TableHead className="text-slate-400">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map(log => (
                      <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/30">
                        <TableCell className="text-xs text-slate-400 font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">{log.userName || "Admin"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${
                            log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            log.action === 'UPDATE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-slate-300">{log.entityType}</TableCell>
                        <TableCell className="text-sm text-slate-300">{log.details}</TableCell>
                      </TableRow>
                    ))}
                    {auditLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-500 py-8">No audit logs recorded yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* DIALOG: ADD EMPLOYEE */}
      <Dialog open={isEmployeeOpen} onOpenChange={setIsEmployeeOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Employee Master Record</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter employee profile details including Kenya statutory identifiers (KRA PIN, NSSF Number, SHIF Number).
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Employee Number *</Label>
              <Input 
                placeholder="EMP-2026-001" 
                value={empForm.employeeNo} 
                onChange={e => setEmpForm({...empForm, employeeNo: e.target.value})}
                className="bg-slate-800 border-slate-700" 
              />
            </div>
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input 
                placeholder="John" 
                value={empForm.firstName} 
                onChange={e => setEmpForm({...empForm, firstName: e.target.value})}
                className="bg-slate-800 border-slate-700" 
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input 
                placeholder="Kamau" 
                value={empForm.lastName} 
                onChange={e => setEmpForm({...empForm, lastName: e.target.value})}
                className="bg-slate-800 border-slate-700" 
              />
            </div>
            <div className="space-y-2">
              <Label>KRA PIN *</Label>
              <Input 
                placeholder="A012345678X" 
                value={empForm.kraPin} 
                onChange={e => setEmpForm({...empForm, kraPin: e.target.value})}
                className="bg-slate-800 border-slate-700 uppercase font-mono" 
              />
            </div>
            <div className="space-y-2">
              <Label>NSSF Number</Label>
              <Input 
                placeholder="NSSF-987654" 
                value={empForm.nssfNo} 
                onChange={e => setEmpForm({...empForm, nssfNo: e.target.value})}
                className="bg-slate-800 border-slate-700" 
              />
            </div>
            <div className="space-y-2">
              <Label>SHIF Number</Label>
              <Input 
                placeholder="SHIF-456789" 
                value={empForm.shifNo} 
                onChange={e => setEmpForm({...empForm, shifNo: e.target.value})}
                className="bg-slate-800 border-slate-700" 
              />
            </div>
            <div className="space-y-2">
              <Label>Basic Salary (KES) *</Label>
              <Input 
                type="number" 
                value={empForm.basicSalary} 
                onChange={e => setEmpForm({...empForm, basicSalary: e.target.value})}
                className="bg-slate-800 border-slate-700" 
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                placeholder="john.kamau@blueprint.co.ke" 
                value={empForm.email} 
                onChange={e => setEmpForm({...empForm, email: e.target.value})}
                className="bg-slate-800 border-slate-700" 
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmployeeOpen(false)} className="bg-slate-800 border-slate-700">Cancel</Button>
            <Button onClick={() => createEmployeeMutation.mutate(empForm)} className="bg-blue-600 hover:bg-blue-500 text-white">Save Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: ADD BRANCH */}
      <Dialog open={isBranchOpen} onOpenChange={setIsBranchOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>Add Branch</DialogTitle>
            <DialogDescription className="text-slate-400">Create a new organizational branch.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Branch Name</Label>
              <Input placeholder="Mombasa Regional Office" value={branchName} onChange={e => setBranchName(e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="Mombasa" value={branchLocation} onChange={e => setBranchLocation(e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBranchOpen(false)} className="bg-slate-800 border-slate-700">Cancel</Button>
            <Button onClick={() => createBranchMutation.mutate({ name: branchName, location: branchLocation })} className="bg-blue-600 hover:bg-blue-500 text-white">Create Branch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: ADD DEPARTMENT */}
      <Dialog open={isDeptOpen} onOpenChange={setIsDeptOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
            <DialogDescription className="text-slate-400">Create a new department.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Department Name</Label>
              <Input placeholder="Human Resources" value={deptName} onChange={e => setDeptName(e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeptOpen(false)} className="bg-slate-800 border-slate-700">Cancel</Button>
            <Button onClick={() => createDeptMutation.mutate({ name: deptName })} className="bg-blue-600 hover:bg-blue-500 text-white">Create Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
