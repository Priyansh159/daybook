import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/providers/AuthProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { ToastProvider } from '@/providers/ToastProvider'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { AdminRoute } from '@/routes/AdminRoute'
import { HomeRedirect, PublicOnlyRoute } from '@/routes/PublicOnlyRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { FullPageSpinner } from '@/components/ui/Spinner'

const Login = lazy(() => import('@/pages/Login'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Profile = lazy(() => import('@/pages/Profile'))
const Tasks = lazy(() => import('@/pages/Tasks'))
const Attendance = lazy(() => import('@/pages/Attendance'))
const Leaves = lazy(() => import('@/pages/Leaves'))
const Wfh = lazy(() => import('@/pages/Wfh'))
const Calendar = lazy(() => import('@/pages/Calendar'))

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const Employees = lazy(() => import('@/pages/admin/Employees'))
const EmployeeDetails = lazy(() => import('@/pages/admin/EmployeeDetails'))
const LeaveManagement = lazy(() => import('@/pages/admin/LeaveManagement'))
const WfhManagement = lazy(() => import('@/pages/admin/WfhManagement'))
const AdminAttendance = lazy(() => import('@/pages/admin/AdminAttendance'))
const AdminTasks = lazy(() => import('@/pages/admin/AdminTasks'))
const Reports = lazy(() => import('@/pages/admin/Reports'))
const Settings = lazy(() => import('@/pages/admin/Settings'))

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<FullPageSpinner />}>
                <Routes>
                  <Route element={<PublicOnlyRoute />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                  </Route>
                  <Route path="/reset-password" element={<ResetPassword />} />

                  <Route element={<ProtectedRoute />}>
                    <Route index element={<HomeRedirect />} />
                    <Route element={<AppLayout />}>
                      {/* Every signed-in employee gets these, admins included — an
                          admin is still a person who marks their own status. */}
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/attendance" element={<Attendance />} />
                      <Route path="/leaves" element={<Leaves />} />
                      <Route path="/wfh" element={<Wfh />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/admin" element={<AdminRoute />}>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="employees" element={<Employees />} />
                        <Route path="employees/:id" element={<EmployeeDetails />} />
                        <Route path="leaves" element={<LeaveManagement />} />
                        <Route path="wfh" element={<WfhManagement />} />
                        <Route path="attendance" element={<AdminAttendance />} />
                        <Route path="tasks" element={<AdminTasks />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="settings" element={<Settings />} />
                      </Route>
                    </Route>
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
