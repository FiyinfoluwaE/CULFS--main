import { useEffect, useState } from "react";
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
import { toast } from "@/hooks/use-toast";
import apiFetch from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "staff" | "admin";
  matricNo?: string;
}

interface LostItem {
  caseNumber: string;
  itemName: string;
  itemType: string;
  status: string;
  lastSeenLocation: string;
  dateReported?: string;
  userId?: string;
  itemColor?: string;
  brand?: string;
  description?: string;
  lastSeenDate?: string;
}

// This is the shape of the item from the form
interface NewLostItem {
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

interface Notification {
  notificationId: string;
  caseNumber: string;
  type: string;
  date: string;
  status: string;
  message: string;
}

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

export const StudentDashboard = ({ user, onLogout }: StudentDashboardProps) => {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "report" | "history"
  >("dashboard");
  const queryClient = useQueryClient();

  const [reportedItems, setReportedItems] = useState<LostItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

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

  const handleItemReported = (newItem: LostItem) => {
    setReportedItems((prev) => [newItem, ...prev]);
    setActiveTab("dashboard");
  };

  const { data: reportedData, refetch: refetchReported } = useQuery<
    LostItem[],
    Error
  >({
    queryKey: ["reportedItems", user.id],
    queryFn: async () => {
      const response = await apiFetch(`/api/lost-items/${user.id}`);
      const json = await response.json();
      return json.items as LostItem[];
    },
  });

  // keep local state in sync with query results
  useEffect(() => {
    if (reportedData) setReportedItems(reportedData || []);
  }, [reportedData]);
  // --- NEW: Delete and Archive handlers ---
  const deleteMutation = useMutation<
    { success: boolean; message?: string },
    Error,
    string
  >({
    mutationFn: async (caseNumber: string) => {
      const res = await apiFetch(`/api/lost-items/${caseNumber}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || (json && json.success === false)) {
        throw new Error(json?.message || "Delete failed");
      }
      return json;
    },
    onSuccess(_, caseNumber) {
      toast({ title: "Deleted", description: "Report deleted", variant: "default" });
      // Optimistically remove from local list so UI updates immediately
      setReportedItems((prev) => prev.filter((i) => i.caseNumber !== caseNumber));
      queryClient.invalidateQueries({ queryKey: ["reportedItems", user.id] });
    },
    onError(error) {
      // Surface server-provided message when available to help debugging
      const msg = error?.message || "Could not delete report";
      console.debug("Delete failed:", msg);
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const handleDeleteLostItem = (item: LostItem) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
  console.debug("Attempting to delete lost item with case number:", item.caseNumber);
  deleteMutation.mutate(item.caseNumber);
  };

  const { data: notificationsData, refetch: refetchNotifications } = useQuery<
    Notification[],
    Error
  >({
    queryKey: ["notifications", user.id],
    queryFn: async () => {
      const res = await apiFetch(`/api/notifications/${user.id}`);
      const json = await res.json();
      return json.notifications as Notification[];
    },
    enabled: false,
  });

  useEffect(() => {
    if (notificationsData) setNotifications(notificationsData || []);
  }, [notificationsData]);

  const handleShowNotifications = async () => {
    setShowNotifications(true);
    setLoadingNotifications(true);
    await refetchNotifications();
    setLoadingNotifications(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Student Dashboard</h1>
              <p className="text-purple-100">Welcome back, {user.name}</p>
              <p className="text-purple-200 text-sm">
                Matric No: {user.matricNo}
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
                            {item.dateReported || item.lastSeenDate}
                          </p>
                          <p>
                            <span className="font-medium">Last Seen:</span>{" "}
                            {item.lastSeenLocation}
                          </p>
                        </div>
                      </div>
                      {item.status === "Reported" ||
                      item.status === "Unclaimed" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600"
                          onClick={() => handleDeleteLostItem(item)}
                        >
                          Delete
                        </Button>
                      ) : null}
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
