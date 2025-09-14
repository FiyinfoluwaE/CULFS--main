import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ReportLostItemForm } from "@/components/forms/ReportLostItemForm";
import { Bell } from "lucide-react";
import apiFetch from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "staff" | "admin";
  staffId?: string;
}

interface LostItem {
  userId: string;
  caseNumber: string;
  itemName: string;
  itemType: string;
  itemColor: string;
  status: string;
  brand: string;
  description: string;
  lastSeenDate: string;
  lastSeenLocation: string;
}

interface DepartmentLostItem {
  caseNumber: string;
  itemName: string;
  itemType: string;
  status: string;
  dateReported: string;
  lastSeenLocation: string;
  reporterName: string;
  reporterEmail: string;
}

interface DepartmentFoundItem {
  foundItemId: string;
  itemName: string;
  itemColor: string;
  foundDate: string;
  foundLocation: string;
  status: string;
  description: string;
}

interface Notification {
  notificationId: string;
  caseNumber: string;
  type: string;
  date: string;
  status: string;
  message: string;
}

interface DepartmentData {
  lostItems: DepartmentLostItem[];
  foundItems: DepartmentFoundItem[];
  office: string;
}

interface StaffResponse {
  success: boolean;
  staff?: {
    officeId?: string;
  };
}

interface DepartmentResponse extends Partial<DepartmentData> {
  success?: boolean;
  message?: string;
}

interface StaffDashboardProps {
  user: User;
  onLogout: () => void;
}

export const StaffDashboard = ({ user, onLogout }: StaffDashboardProps) => {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "report" | "history"
  >("dashboard");
  const [reportedItems, setReportedItems] = useState<LostItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [departmentLostItems, setDepartmentLostItems] = useState<
    DepartmentLostItem[]
  >([]);
  const [departmentFoundItems, setDepartmentFoundItems] = useState<
    DepartmentFoundItem[]
  >([]);
  const [loadingDepartmentUpdates, setLoadingDepartmentUpdates] =
    useState(false);
  const [departmentError, setDepartmentError] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string>("");
  const queryClient = useQueryClient();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Reported":
        return "bg-blue-100 text-blue-800";
      case "Found":
        return "bg-green-100 text-green-800";
      case "Matched":
        return "bg-yellow-100 text-yellow-800";
      case "Claimed":
        return "bg-purple-100 text-purple-800";
      case "Unclaimed":
        return "bg-orange-100 text-orange-800";
      case "Archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleItemReported = (item: LostItem) => {
    // invalidate reported items for this user
    queryClient.invalidateQueries({ queryKey: ["reportedItems", user.id] });
    setActiveTab("dashboard");
  };
  const { data: reportedData } = useQuery<{ items: LostItem[] }, Error>({
    queryKey: ["reportedItems", user.id],
    queryFn: async () => {
      const res = await apiFetch(`/api/lost-items/${user.id}`);
      const json = await res.json();
      return json as { items: LostItem[] };
    },
  });

  useEffect(() => {
    if (reportedData && reportedData.items)
      setReportedItems(reportedData.items);
  }, [reportedData]);

  const { data: notificationsData, refetch: refetchNotifications } = useQuery<
    Notification[] | { notifications: Notification[] },
    Error
  >({
    queryKey: ["notifications", user.id],
    queryFn: async () => {
      const res = await apiFetch(`/api/notifications/${user.id}`);
      const json = await res.json();
      if (json && Array.isArray(json.notifications))
        return json.notifications as Notification[];
      if (Array.isArray(json)) return json as Notification[];
      return [] as Notification[];
    },
    enabled: false,
  });

  useEffect(() => {
    if (notificationsData)
      setNotifications((notificationsData as Notification[]) || []);
  }, [notificationsData]);

  const handleShowNotifications = async () => {
    setShowNotifications(true);
    setLoadingNotifications(true);
    await refetchNotifications();
    setLoadingNotifications(false);
  };

  // React Query: fetch staff record (to obtain officeId), then fetch department updates
  const staffQuery = useQuery({
    queryKey: ["staff", user.staffId],
    queryFn: async () => {
      if (!user.staffId) return null;
      const res = await apiFetch(
        `/api/staff/${encodeURIComponent(user.staffId)}`
      );
      return res.json();
    },
    enabled: user.role === "staff" && !!user.staffId,
  });

  const officeId =
    ((staffQuery.data as StaffResponse | null) &&
      (staffQuery.data as StaffResponse).staff?.officeId) ||
    null;

  const departmentQuery = useQuery({
    queryKey: ["department-lost-found", officeId],
    queryFn: async () => {
      if (!officeId) return null;
      const res = await apiFetch(`/api/department-lost-found/${officeId}`);
      return res.json();
    },
    enabled: !!officeId,
  });

  // Update local state from the department query results
  useEffect(() => {
    setLoadingDepartmentUpdates(
      !!departmentQuery.isFetching || !!staffQuery.isFetching
    );
    if (departmentQuery.isError) {
      const err = departmentQuery.error as Error | null;
      setDepartmentError(err?.message || "Error fetching updates");
      return;
    }

    if (departmentQuery.data) {
      const data = departmentQuery.data as DepartmentResponse;
      if (data.success === false) {
        setDepartmentError(data.message || "Error fetching updates");
        return;
      }
      setDepartmentLostItems(data.lostItems || []);
      setDepartmentFoundItems(data.foundItems || []);
      setDepartmentName(data.office || "");
      setDepartmentError(null);
    }
  }, [
    departmentQuery.data,
    departmentQuery.isFetching,
    departmentQuery.isError,
    departmentQuery.error,
    staffQuery.isFetching,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Staff Dashboard</h1>
              <p className="text-purple-100">Welcome back, {user.name}</p>
              <p className="text-purple-200 text-sm">
                Staff ID: {user.staffId}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Notification Icon */}
              <button
                onClick={handleShowNotifications}
                className="relative focus:outline-none"
              >
                <Bell className="w-6 h-6 text-white" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1">
                    {notifications.length}
                  </span>
                )}
              </button>
              <Button
                variant="outline"
                onClick={onLogout}
                className="border-white text-purple-600 hover:bg-white hover:text-purple-600"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "dashboard"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("report")}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "report"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Report Lost Item
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "history"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              My Reports
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="border-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <span className="text-blue-600 text-xl">📋</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Reports
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportedItems.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-full">
                      <span className="text-green-600 text-xl">✅</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Items Found
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {
                          reportedItems.filter(
                            (item) =>
                              item.status === "Found" ||
                              item.status === "Claimed"
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <span className="text-yellow-600 text-xl">⏳</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Pending
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {
                          reportedItems.filter(
                            (item) => item.status === "Reported"
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <span className="text-purple-600 text-xl">🎯</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Matched
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {
                          reportedItems.filter(
                            (item) => item.status === "Matched"
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Staff-specific welcome message */}
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-white">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-purple-800 mb-2">
                  Staff Portal
                </h2>
                <p className="text-purple-700">
                  As a staff member, you can report lost items and track their
                  status. You also have access to departmental lost and found
                  updates.
                </p>
              </CardContent>
            </Card>

            {/* Departmental Lost & Found Updates */}
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-white">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-purple-800 mb-2">
                  {departmentName
                    ? `${departmentName} - Lost & Found Updates`
                    : "Departmental Lost & Found Updates"}
                </h2>
                {loadingDepartmentUpdates ? (
                  <div className="text-center py-4">
                    <p className="text-purple-600">
                      Loading department updates...
                    </p>
                  </div>
                ) : departmentError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{departmentError}</p>
                    <Button
                      onClick={() => window.location.reload()}
                      className="mt-2 bg-red-100 text-red-600 hover:bg-red-200"
                      size="sm"
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-purple-700 mb-2">
                        Lost Items{" "}
                        {departmentLostItems.length > 0 &&
                          `(${departmentLostItems.length})`}
                      </h3>
                      {departmentLostItems.length === 0 ? (
                        <div className="bg-white border rounded-lg p-4">
                          <p className="text-gray-500 text-center">
                            No lost items reported in your department.
                          </p>
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {departmentLostItems.map((item) => (
                            <li
                              key={item.caseNumber}
                              className="p-3 border rounded-lg bg-white hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold">
                                      {item.itemName}
                                    </span>
                                    <Badge
                                      className={getStatusColor(item.status)}
                                    >
                                      {item.status}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    Reported by: {item.reporterName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Last seen: {item.lastSeenLocation}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    Case #{item.caseNumber}
                                  </div>
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                  {item.dateReported}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-700 mb-2">
                        Found Items{" "}
                        {departmentFoundItems.length > 0 &&
                          `(${departmentFoundItems.length})`}
                      </h3>
                      {departmentFoundItems.length === 0 ? (
                        <div className="bg-white border rounded-lg p-4">
                          <p className="text-gray-500 text-center">
                            No found items logged by your office.
                          </p>
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {departmentFoundItems.map((item) => (
                            <li
                              key={item.foundItemId}
                              className="p-3 border rounded-lg bg-white hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold">
                                      {item.itemName}
                                    </span>
                                    <Badge
                                      className={getStatusColor(item.status)}
                                    >
                                      {item.status}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    Color: {item.itemColor}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Location: {item.foundLocation}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    Case: {item.foundItemId}
                                  </div>
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                  {item.foundDate}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>
                  Your most recently reported lost items
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportedItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No items reported yet</p>
                    <Button
                      onClick={() => setActiveTab("report")}
                      className="mt-4 bg-purple-600 hover:bg-purple-700"
                    >
                      Report Your First Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reportedItems.slice(0, 3).map((item) => (
                      <div
                        key={item.caseNumber}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-medium">{item.itemName}</h3>
                          <p className="text-sm text-gray-600">
                            Case: {item.caseNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            Last seen: {item.lastSeenLocation}
                          </p>
                        </div>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "report" && (
          <ReportLostItemForm
            userId={user.id}
            onItemReported={handleItemReported}
          />
        )}

        {activeTab === "history" && (
          <Card>
            <CardHeader>
              <CardTitle>My Reported Items</CardTitle>
              <CardDescription>
                Complete history of your reported lost items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportedItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No items reported yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reportedItems.map((item) => (
                    <div
                      key={item.caseNumber}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{item.itemName}</h3>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p>
                            <span className="font-medium">Case Number:</span>{" "}
                            {item.caseNumber}
                          </p>
                          <p>
                            <span className="font-medium">Type:</span>{" "}
                            {item.itemType}
                          </p>
                        </div>
                        <div>
                          <p>
                            <span className="font-medium">Date Reported:</span>{" "}
                            {item.lastSeenDate}
                          </p>
                          <p>
                            <span className="font-medium">Last Seen:</span>{" "}
                            {item.lastSeenLocation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      {/* --- NEW: Notifications Drawer --- */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {loadingNotifications ? (
              <p className="text-center text-gray-500">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <p className="text-center text-gray-500">No new notifications</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.notificationId}
                  className="p-4 border-b last:border-b-0"
                >
                  <p className="text-sm text-gray-600">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(notification.date).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNotifications(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
