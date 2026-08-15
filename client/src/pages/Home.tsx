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
  Briefcase, DollarSign, Calendar, CheckCircle2, AlertCircle, LogOut, UserCheck, Settings, Search,
  Calculator, CalendarDays
} from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loginEmail, setLoginEmail] = useState("admin@blueprinthr.co.ke");
  const [loginPassword, setLoginPassword] = useState("BluePrint!2026");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      toast.success("Welcome back to BluePrint HR.");
      await utils.auth.me.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

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
    bankName: "",
    bankBranch: "",
    accountNumber: "",
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
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantAddress, setTenantAddress] = useState("");

  // Queries
  const { data: tenant } = trpc.tenant.get.useQuery(undefined, { enabled: isAuthenticated });
  const { data: employees = [], refetch: refetchEmployees } = trpc.employee.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: branches = [], refetch: refetchBranches } = trpc.org.branches.useQuery(undefined, { enabled: isAuthenticated });
  const { data: departments = [], refetch: refetchDepartments } = trpc.org.departments.useQuery(undefined, { enabled: isAuthenticated });
  const { data: designations = [] } = trpc.org.designations.useQuery(undefined, { enabled: isAuthenticated });
  const { data: grades = [] } = trpc.org.grades.useQuery(undefined, { enabled: isAuthenticated });
  const { data: employmentTypes = [] } = trpc.org.employmentTypes.useQuery(undefined, { enabled: isAuthenticated });
  const { data: auditLogs = [], refetch: refetchAudit } = trpc.audit.list.useQuery(undefined, { enabled: isAuthenticated && ["Super Admin", "Company Admin", "HR Manager"].includes(user?.role || "") });

  // Phase 2 queries & mutations
  const [selectedPeriodId, setSelectedPeriodId] = useState(1);
  const { data: payrollPeriods = [] } = trpc.payroll.periods.useQuery(undefined, { enabled: isAuthenticated });
  const { data: payrollTx = [], refetch: refetchPayroll } = trpc.payroll.transactions.useQuery({ payrollPeriodId: selectedPeriodId }, { enabled: isAuthenticated });
  const { data: leaveTypes = [] } = trpc.leave.types.useQuery(undefined, { enabled: isAuthenticated });
  const { data: leaveBalances = [], refetch: refetchLeaveBalances } = trpc.leave.balances.useQuery({}, { enabled: isAuthenticated });
  const { data: leaveRequests = [], refetch: refetchLeaveRequests } = trpc.leave.requests.useQuery({}, { enabled: isAuthenticated });
  const { data: essProfile } = trpc.ess.myProfile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: essPayslips = [] } = trpc.ess.myPayslips.useQuery(undefined, { enabled: isAuthenticated });

  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employeeId: 1,
    leaveTypeId: 1,
    startDate: "2026-09-01",
    endDate: "2026-09-05",
    daysRequested: "5",
    reason: "Annual family vacation"
  });

  const processPayrollMutation = trpc.payroll.processRun.useMutation({
    onSuccess: () => {
      toast.success("Payroll run processed successfully with Kenya statutory compliance formulas.");
      refetchPayroll();
    },
    onError: (err) => toast.error(err.message)
  });

  const createLeaveMutation = trpc.leave.createRequest.useMutation({
    onSuccess: () => {
      toast.success("Leave request submitted successfully.");
      setIsLeaveOpen(false);
      refetchLeaveRequests();
      refetchLeaveBalances();
    },
    onError: (err) => toast.error(err.message)
  });

  const updateLeaveMutation = trpc.leave.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Leave request status updated.");
      refetchLeaveRequests();
      refetchLeaveBalances();
    },
    onError: (err) => toast.error(err.message)
  });

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
      <div className="min-h-screen bg-[#07111f] text-slate-100 flex items-center justify-center p-5 relative overflow-hidden">
        <div className="absolute -top-36 -right-28 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-44 -left-32 w-[28rem] h-[28rem] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-[1.05fr_0.95fr] rounded-[2rem] overflow-hidden border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-950">
            <div>
              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center font-bold tracking-tight text-xl mb-8">BP</div>
              <p className="text-blue-100/80 text-sm uppercase tracking-[0.28em] font-semibold">BluePrint HR</p>
              <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight">People operations, brought into focus.</h1>
              <p className="mt-6 text-blue-100/75 leading-relaxed max-w-md">A Kenya-focused HR and payroll foundation for modern teams — structured, compliant, and ready to scale.</p>
            </div>
            <div className="space-y-3 text-sm text-blue-100/80">
              <p className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-cyan-300" /> Multi-tenant architecture with strict isolation</p>
              <p className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-cyan-300" /> Employee master with Kenya statutory identifiers</p>
              <p className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-cyan-300" /> Role-aware workflows and audit visibility</p>
            </div>
          </div>
          <div className="p-7 sm:p-12 bg-slate-950/70">
            <div className="lg:hidden w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-bold tracking-tight text-xl mb-8">BP</div>
            <div className="max-w-sm mx-auto">
              <p className="text-sm text-blue-400 font-semibold tracking-wide">SECURE WORKSPACE ACCESS</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Sign in to your workspace</h2>
              <p className="mt-3 text-sm text-slate-400">Use your BluePrint HR account credentials to continue.</p>
              <form className="mt-9 space-y-5" onSubmit={(event) => {
                event.preventDefault();
                loginMutation.mutate({ email: loginEmail, password: loginPassword });
              }}>
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-slate-300">Work email</Label>
                  <Input id="login-email" type="email" autoComplete="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} className="h-12 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600" placeholder="you@company.co.ke" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-slate-300">Password</Label>
                  <div className="relative">
                    <Input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} className="h-12 pr-20 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600" placeholder="Enter your password" required minLength={8} />
                    <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-blue-400">{showPassword ? "Hide" : "Show"}</button>
                  </div>
                </div>
                <Button type="submit" disabled={loginMutation.isPending} className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20">
                  {loginMutation.isPending ? "Signing in…" : "Sign in securely"}
                </Button>
              </form>
              <div className="mt-7 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-400 leading-relaxed">
                <p className="font-semibold text-slate-200 mb-1">Initial administrator access</p>
                <p>For the first deployment, the seeded account is pre-filled above. Change the password after sign-in before inviting additional users.</p>
              </div>
              <p className="mt-7 text-center text-xs text-slate-600">Protected by signed, server-side sessions · Kenya-ready HR foundation</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <SelectTrigger className="h-7 text-xs bg-slate-900 border-slate-700 text-blue-400 font-medium w-40">
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
            <TabsTrigger value="payroll" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium transition-all">
              <Calculator className="w-4 h-4 mr-2" /> Kenyan Payroll
            </TabsTrigger>
            <TabsTrigger value="leave" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium transition-all">
              <CalendarDays className="w-4 h-4 mr-2" /> Leave Management
            </TabsTrigger>
            <TabsTrigger value="ess" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm font-medium transition-all">
              <UserCheck className="w-4 h-4 mr-2" /> ESS Portal
            </TabsTrigger>
            {["Super Admin", "Company Admin", "HR Manager"].includes(user?.role || "") && (
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
                              <TableCell>
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
                <p className="text-sm text-slate-400">Manage employee profiles, statutory numbers (KRA PIN, NSSF Number, SHIF Number), and bank details.</p>
              </div>
              {["Super Admin", "Company Admin", "HR Manager"].includes(user?.role || "") && (
                <Button onClick={() => setIsEmployeeOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white shadow-md">
                  <Plus className="w-4 h-4 mr-2" /> Add Employee
                </Button>
              )}
            </div>

            <Card className="bg-slate-900 border-slate-800 shadow-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-800/50">
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Employee Number</TableHead>
                    <TableHead className="text-slate-400">Full Name</TableHead>
                    <TableHead className="text-slate-400">KRA PIN</TableHead>
                    <TableHead className="text-slate-400">NSSF Number</TableHead>
                    <TableHead className="text-slate-400">SHIF Number</TableHead>
                    <TableHead className="text-slate-400">Basic Salary (KES)</TableHead>
                    <TableHead className="text-slate-400">Bank Details</TableHead>
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
                      <TableCell className="text-xs text-slate-300">{emp.bankName ? `${emp.bankName} (${emp.accountNumber})` : "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          {emp.employmentStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {employees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-slate-500 py-8">
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

          {/* PAYROLL TAB */}
          <TabsContent value="payroll" className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl gap-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-blue-500" /> Kenyan Statutory Payroll Engine
                </h2>
                <p className="text-sm text-slate-400 mt-1">Automated PAYE bands, personal relief, Tier I/II NSSF, SHIF (2.75%), and Housing Levy (1.5%).</p>
              </div>
              {["Super Admin", "Company Admin", "Payroll Manager"].includes(user?.role || "") && (
                <div className="flex gap-3">
                  <Button onClick={() => processPayrollMutation.mutate({ payrollPeriodId: selectedPeriodId })} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg">
                    Process Payroll Run (August 2026)
                  </Button>
                </div>
              )}
            </div>

            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Payroll Transactions & Statutory Summary</CardTitle>
                <CardDescription className="text-slate-400">Computed gross pay, taxable pay, statutory deductions, and net pay per employee.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-800/50">
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Employee</TableHead>
                      <TableHead className="text-slate-400">Basic (KES)</TableHead>
                      <TableHead className="text-slate-400">Gross (KES)</TableHead>
                      <TableHead className="text-slate-400">NSSF</TableHead>
                      <TableHead className="text-slate-400">PAYE</TableHead>
                      <TableHead className="text-slate-400">SHIF</TableHead>
                      <TableHead className="text-slate-400">Housing Levy</TableHead>
                      <TableHead className="text-slate-400">Net Pay (KES)</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollTx.map((tx: any) => {
                      const emp = employees.find(e => e.id === tx.employeeId);
                      return (
                        <TableRow key={tx.id} className="border-slate-800 hover:bg-slate-800/30">
                          <TableCell className="font-medium">
                            {emp ? `${emp.firstName} ${emp.lastName}` : `ID: ${tx.employeeId}`}
                            <div className="text-xs text-slate-400">{emp?.employeeNo}</div>
                          </TableCell>
                          <TableCell className="font-mono">KES {Number(tx.basicSalary).toLocaleString()}</TableCell>
                          <TableCell className="font-mono font-bold text-slate-200">KES {Number(tx.grossPay).toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-slate-400">KES {Number(tx.nssf).toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-slate-400">KES {Number(tx.paye).toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-slate-400">KES {Number(tx.shif).toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-slate-400">KES {Number(tx.housingLevy).toLocaleString()}</TableCell>
                          <TableCell className="font-mono font-bold text-emerald-400">KES {Number(tx.netPay).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                              {tx.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {payrollTx.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-slate-500 py-12">
                          No payroll transactions computed for this period yet. Click "Process Payroll Run" above to calculate statutory deductions.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LEAVE MANAGEMENT TAB */}
          <TabsContent value="leave" className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl gap-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <CalendarDays className="w-6 h-6 text-blue-500" /> Leave Management & Approvals
                </h2>
                <p className="text-sm text-slate-400 mt-1">Manage leave types, balances, accruals, and supervisory approval workflows.</p>
              </div>
              <Button onClick={() => setIsLeaveOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg">
                <Plus className="w-4 h-4 mr-2" /> Apply for Leave
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-900 border-slate-800 shadow-xl md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">My Leave Balances (2026)</CardTitle>
                  <CardDescription className="text-slate-400">Entitlements and remaining days</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {leaveBalances.map((bal: any) => {
                    const lt = leaveTypes.find((t: any) => t.id === bal.leaveTypeId);
                    const allocated = Number(bal.allocatedDays);
                    const used = Number(bal.usedDays);
                    const remaining = allocated - used;
                    return (
                      <div key={bal.id} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm">{lt?.name || "Leave"}</p>
                          <p className="text-xs text-slate-400">Used: {used} / Allocated: {allocated}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-blue-400">{remaining}</span>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Days Left</p>
                        </div>
                      </div>
                    );
                  })}
                  {leaveBalances.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No leave balances found.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 shadow-xl md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Leave Requests & Approval Queue</CardTitle>
                  <CardDescription className="text-slate-400">Track and manage leave applications</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-800/50">
                      <TableRow className="border-slate-800">
                        <TableHead className="text-slate-400">Type</TableHead>
                        <TableHead className="text-slate-400">Dates</TableHead>
                        <TableHead className="text-slate-400">Days</TableHead>
                        <TableHead className="text-slate-400">Reason</TableHead>
                        <TableHead className="text-slate-400">Status</TableHead>
                        {["Super Admin", "Company Admin", "HR Manager"].includes(user?.role || "") && (
                          <TableHead className="text-slate-400 text-right">Action</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveRequests.map((req: any) => {
                        const lt = leaveTypes.find((t: any) => t.id === req.leaveTypeId);
                        return (
                          <TableRow key={req.id} className="border-slate-800 hover:bg-slate-800/30">
                            <TableCell className="font-medium">{lt?.name || "Leave"}</TableCell>
                            <TableCell className="text-xs text-slate-300 font-mono">
                              {req.startDate} to {req.endDate}
                            </TableCell>
                            <TableCell className="font-bold">{req.daysRequested} days</TableCell>
                            <TableCell className="text-sm text-slate-400 truncate max-w-[200px]">{req.reason}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${
                                req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                req.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              }`}>
                                {req.status}
                              </Badge>
                            </TableCell>
                            {["Super Admin", "Company Admin", "HR Manager"].includes(user?.role || "") && (
                              <TableCell className="text-right space-x-2">
                                {req.status === 'Pending' && (
                                  <>
                                    <Button size="sm" onClick={() => updateLeaveMutation.mutate({ requestId: req.id, status: 'Approved' })} className="bg-emerald-600 hover:bg-emerald-500 text-xs h-7">Approve</Button>
                                    <Button size="sm" variant="destructive" onClick={() => updateLeaveMutation.mutate({ requestId: req.id, status: 'Rejected' })} className="text-xs h-7">Reject</Button>
                                  </>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                      {leaveRequests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-slate-500 py-8">No leave requests found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ESS PORTAL TAB */}
          <TabsContent value="ess" className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <UserCheck className="w-6 h-6 text-blue-500" /> Employee Self-Service (ESS) Portal
                </h2>
                <p className="text-sm text-slate-400 mt-1">Access your digital payslips, P9 tax deduction cards, and profile details.</p>
              </div>
              <Badge className="bg-blue-600 text-white px-3 py-1 text-sm font-medium">Active Session</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-900 border-slate-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg">My Profile Summary</CardTitle>
                  <CardDescription className="text-slate-400">Statutory and employment credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {essProfile ? (
                    <>
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-400">Full Name</span>
                        <span className="font-semibold">{essProfile.firstName} {essProfile.lastName}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-400">Employee No</span>
                        <span className="font-mono text-blue-400">{essProfile.employeeNo}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-400">KRA PIN</span>
                        <span className="font-mono">{essProfile.kraPin}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-400">NSSF No</span>
                        <span className="font-mono">{essProfile.nssfNo || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-400">SHIF No</span>
                        <span className="font-mono">{essProfile.shifNo || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-400">Bank Details</span>
                        <span>{essProfile.bankName} ({essProfile.accountNumber})</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-500 text-center py-6">No employee profile linked to this account.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 shadow-xl md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">My Payslips & Payroll History</CardTitle>
                  <CardDescription className="text-slate-400">Download monthly payslips and view statutory deductions</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-800/50">
                      <TableRow className="border-slate-800">
                        <TableHead className="text-slate-400">Period</TableHead>
                        <TableHead className="text-slate-400">Gross (KES)</TableHead>
                        <TableHead className="text-slate-400">PAYE</TableHead>
                        <TableHead className="text-slate-400">NSSF</TableHead>
                        <TableHead className="text-slate-400">SHIF</TableHead>
                        <TableHead className="text-slate-400">Net Pay (KES)</TableHead>
                        <TableHead className="text-slate-400 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {essPayslips.map((slip: any) => (
                        <TableRow key={slip.id} className="border-slate-800 hover:bg-slate-800/30">
                          <TableCell className="font-medium">August 2026</TableCell>
                          <TableCell className="font-mono">KES {Number(slip.grossPay).toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-slate-400">KES {Number(slip.paye).toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-slate-400">KES {Number(slip.nssf).toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-slate-400">KES {Number(slip.shif).toLocaleString()}</TableCell>
                          <TableCell className="font-mono font-bold text-emerald-400">KES {Number(slip.netPay).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => toast.success("Downloading official PDF payslip...")} className="bg-slate-800 border-slate-700 text-xs h-7">
                              <FileText className="w-3.5 h-3.5 mr-1" /> Payslip
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {essPayslips.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-slate-500 py-12">No payslips available for download yet.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AUDIT LOG TAB */}
          {["Super Admin", "Company Admin", "HR Manager"].includes(user?.role || "") && (
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
              Enter employee profile details including Kenya statutory identifiers (KRA PIN, NSSF Number, SHIF Number) and bank details.
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
              <Label>Bank Name</Label>
              <Input 
                placeholder="Equity Bank" 
                value={empForm.bankName} 
                onChange={e => setEmpForm({...empForm, bankName: e.target.value})}
                className="bg-slate-800 border-slate-700" 
              />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input 
                placeholder="0123456789012" 
                value={empForm.accountNumber} 
                onChange={e => setEmpForm({...empForm, accountNumber: e.target.value})}
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

      {/* DIALOG: REGISTER COMPANY */}
      <Dialog open={isTenantOpen} onOpenChange={setIsTenantOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle>Register New Company</DialogTitle>
            <DialogDescription className="text-slate-400">Provision a new multi-tenant organization.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input placeholder="Acme Kenya Ltd" value={companyName} onChange={e => setCompanyName(e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>KRA PIN *</Label>
              <Input placeholder="P051234567X" value={tenantKra} onChange={e => setTenantKra(e.target.value)} className="bg-slate-800 border-slate-700 uppercase font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input placeholder="hr@acme.co.ke" value={tenantEmail} onChange={e => setTenantEmail(e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input placeholder="+254 700 000 000" value={tenantPhone} onChange={e => setTenantPhone(e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>Physical Address</Label>
              <Input placeholder="Nairobi, Kenya" value={tenantAddress} onChange={e => setTenantAddress(e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTenantOpen(false)} className="bg-slate-800 border-slate-700">Cancel</Button>
            <Button onClick={() => createTenantMutation.mutate({ companyName, kraPin: tenantKra, email: tenantEmail, phone: tenantPhone, address: tenantAddress })} className="bg-blue-600 hover:bg-blue-500 text-white">Register Company</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: APPLY FOR LEAVE */}
      <Dialog open={isLeaveOpen} onOpenChange={setIsLeaveOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription className="text-slate-400">Submit a leave request for supervisory approval.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={String(leaveForm.leaveTypeId)} onValueChange={val => setLeaveForm({...leaveForm, leaveTypeId: Number(val)})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                  {leaveTypes.map((lt: any) => (
                    <SelectItem key={lt.id} value={String(lt.id)}>{lt.name} ({lt.defaultDays} days default)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} className="bg-slate-800 border-slate-700" />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} className="bg-slate-800 border-slate-700" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Days Requested</Label>
              <Input type="number" value={leaveForm.daysRequested} onChange={e => setLeaveForm({...leaveForm, daysRequested: e.target.value})} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>Reason / Notes</Label>
              <Input placeholder="Family vacation / medical rest" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} className="bg-slate-800 border-slate-700" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeaveOpen(false)} className="bg-slate-800 border-slate-700">Cancel</Button>
            <Button onClick={() => createLeaveMutation.mutate({ ...leaveForm, employeeId: 1 })} className="bg-blue-600 hover:bg-blue-500 text-white">Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
