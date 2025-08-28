"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Home,
  Users,
  DollarSign,
  Clock,
  LogOut,
  Eye,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { AddPropertyForm } from "@/components/add-property-form";
import type { Property } from "@/lib/types";

interface DashboardStats {
  total_properties: number;
  total_applications: number;
  pending_applications: number;
  approved_applications: number;
  total_revenue: number;
}

interface PropertyWithExtras extends Omit<Property, "rental_terms"> {
  pricing_type: string;
  facilities: string[] | null;
  rental_terms?: any;
  price_per_month_eth: number;
}

interface Application {
  id: string;
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string;
  tenant_address: string;
  tenant_occupation: string;
  tenant_income: number;
  duration: number;
  total_amount: number;
  total_amount_idr: number;
  is_approved: boolean | null;
  is_paid: boolean;
  message: string;
  created_at: string;
  tenant_wallet: string;
  properties: {
    id: string;
    title: string;
    location: string;
    price_per_month: number;
    price_per_month_idr: number;
  };
}

interface Transaction {
  id: string;
  tenant_wallet: string;
  amount_eth: number;
  amount_idr: number;
  transaction_hash: string;
  payment_type: string;
  created_at: string;
  rental_applications: {
    tenant_name: string;
    properties: {
      title: string;
    };
  };
}

interface LeaseAgreement {
  id: string;
  application_id: string;
  tenant_wallet: string;
  lease_start_date: string;
  lease_end_date: string;
  monthly_rent: number;
  monthly_rent_idr: number;
  security_deposit: number;
  security_deposit_idr: number;
  terms_and_conditions: string;
  status: string;
  landlord_signature?: string;
  approved_at?: string;
  created_at: string;
  rental_applications: {
    tenant_name: string;
    tenant_email: string;
    tenant_phone: string;
    duration: number;
    total_amount: number;
    total_amount_idr: number;
    properties: {
      title: string;
      location: string;
    };
  };
}

export default function LandlordDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [properties, setProperties] = useState<PropertyWithExtras[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [leaseAgreements, setLeaseAgreements] = useState<LeaseAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProperty, setShowAddProperty] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/landlord/login");
        return;
      }

      setUser(user);
      await loadDashboardData(user.id);
    } catch (error) {
      console.error("Auth error:", error);
      router.push("/landlord/login");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async (landlordId: string) => {
    try {
      const response = await fetch(
        `/api/landlords/dashboard?landlord_id=${landlordId}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        setStats(result.data.stats);
        setApplications(result.data.applications);
        setTransactions(result.data.transactions);
      } else {
        console.error("Dashboard error:", result.error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      }

      const propertiesResponse = await fetch(
        `/api/properties?landlord_id=${landlordId}`
      );
      const propertiesResult = await propertiesResponse.json();

      if (propertiesResult.success) {
        setProperties(propertiesResult.data || []);
      }

      const leaseResponse = await fetch(
        `/api/lease-agreements?landlord_id=${landlordId}`
      );
      const leaseResult = await leaseResponse.json();

      if (leaseResult.success) {
        setLeaseAgreements(leaseResult.data || []);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    }
  };

  const handleApproveApplication = async (applicationId: string) => {
    try {
      console.log(
        "[v0] Starting approval process for application:",
        applicationId
      );

      const application = applications.find((app) => app.id === applicationId);
      if (!application) {
        console.log(
          "[v0] Application not found in local state:",
          applicationId
        );
        return;
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, is_approved: true } : app
        )
      );

      console.log("[v0] Found application:", {
        id: application.id,
        tenant_name: application.tenant_name,
        current_approval_status: application.is_approved,
      });

      // Step 1: Approve the rental application
      console.log(
        "[v0] Step 1: Updating rental application approval status..."
      );
      const updateResponse = await fetch(
        `/api/rental-applications/${applicationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_approved: true }),
        }
      );

      console.log("[v0] Update response status:", updateResponse.status);
      console.log("[v0] Update response ok:", updateResponse.ok);

      if (!updateResponse.ok) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, is_approved: null } : app
          )
        );

        const errorText = await updateResponse.text();
        console.log("[v0] Update response error text:", errorText);
        throw new Error(
          `Failed to update application: ${updateResponse.status} - ${errorText}`
        );
      }

      const updateResult = await updateResponse.json();
      console.log("[v0] Update result:", updateResult);

      if (!updateResult.success) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, is_approved: null } : app
          )
        );

        console.log("[v0] Update failed with result:", updateResult);
        throw new Error(updateResult.error || "Failed to approve application");
      }

      console.log("[v0] Step 1 completed successfully");

      // Step 2: Create lease agreement automatically
      console.log("[v0] Step 2: Creating lease agreement...");
      const leaseData = {
        application_id: applicationId,
        landlord_id: user.id,
        tenant_wallet: application.tenant_wallet,
        lease_start_date: new Date().toISOString(),
        lease_end_date: new Date(
          Date.now() + application.duration * 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        monthly_rent: application.properties.price_per_month,
        monthly_rent_idr: application.properties.price_per_month_idr,
        security_deposit: application.properties.price_per_month,
        security_deposit_idr: application.properties.price_per_month_idr,
        terms_and_conditions: "Standard rental agreement terms and conditions.",
        status: "approved", // Automatically approve lease agreement
        approved_at: new Date().toISOString(), // Add approved_at timestamp for immediate activation
      };

      console.log("[v0] Lease agreement data:", leaseData);

      const leaseResponse = await fetch("/api/lease-agreements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leaseData),
      });

      console.log("[v0] Lease response status:", leaseResponse.status);
      console.log("[v0] Lease response ok:", leaseResponse.ok);

      if (!leaseResponse.ok) {
        const errorText = await leaseResponse.text();
        console.log("[v0] Lease response error text:", errorText);
        throw new Error(
          `Failed to create lease agreement: ${leaseResponse.status} - ${errorText}`
        );
      }

      const leaseResult = await leaseResponse.json();
      console.log("[v0] Lease result:", leaseResult);

      if (leaseResult.success) {
        console.log("[v0] Step 2 completed successfully");
        console.log("[v0] Approval process completed successfully");

        toast({
          title: "Aplikasi Disetujui",
          description: "Penyewa sekarang dapat melakukan pembayaran langsung.",
        });

        console.log("[v0] Reloading dashboard data...");
        await loadDashboardData(user.id);
        console.log("[v0] Dashboard data reloaded");
      } else {
        throw new Error(
          leaseResult.error || "Failed to create lease agreement"
        );
      }
    } catch (error) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, is_approved: null } : app
        )
      );

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("[v0] Error in approval process:", error);
      toast({
        title: "Error",
        description: `Gagal menyetujui aplikasi: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    try {
      const response = await fetch(
        `/api/rental-applications/${applicationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_approved: false }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Aplikasi Ditolak",
          description: "Aplikasi sewa telah ditolak.",
        });
        await loadDashboardData(user.id);
      }
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast({
        title: "Error",
        description: "Gagal menolak aplikasi",
        variant: "destructive",
      });
    }
  };

  const handleResetApplication = async (applicationId: string) => {
    try {
      const response = await fetch(
        `/api/rental-applications/${applicationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_approved: null }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Aplikasi Direset",
          description:
            "Aplikasi telah dikembalikan ke status pending untuk ditinjau ulang.",
        });
        await loadDashboardData(user.id);
      }
    } catch (error) {
      console.error("Error resetting application:", error);
      toast({
        title: "Error",
        description: "Gagal mereset aplikasi",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/landlord/login");
  };

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatETH = (amount: number) => {
    return `${amount.toFixed(4)} ETH`;
  };

  const handlePropertyAdded = () => {
    setShowAddProperty(false);
    loadDashboardData(user.id);
    toast({
      title: "Properti Berhasil Ditambahkan",
      description: "Properti baru telah ditambahkan dan tersedia untuk disewa.",
    });
  };

  const handleToggleAvailability = async (
    propertyId: string,
    currentStatus: boolean
  ) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_available: !currentStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Status Properti Diperbarui",
          description: `Properti ${
            !currentStatus ? "tersedia" : "tidak tersedia"
          } untuk disewa.`,
        });
        await loadDashboardData(user.id);
      }
    } catch (error) {
      console.error("Error updating property:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui status properti",
        variant: "destructive",
      });
    }
  };

  // Removed handleApproveLeaseAgreement and handleRejectLeaseAgreement functions

  useEffect(() => {
    if (!user?.id) return;

    const refreshInterval = setInterval(async () => {
      try {
        await loadDashboardData(user.id);
      } catch (error) {
        console.error("Error auto-refreshing dashboard:", error);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [user?.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6" />
            <h1 className="text-xl font-bold">Dashboard Pemilik</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Selamat Datang, {user?.user_metadata?.name || user?.email}
            </span>
            <Link href="/">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Lihat Situs
              </Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Properti
                </CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.total_properties}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Aplikasi
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.total_applications}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Menunggu Persetujuan
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.pending_applications}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Pendapatan
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatIDR(stats.total_revenue)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="properties" className="space-y-4">
          <TabsList>
            <TabsTrigger value="properties">Properti Saya</TabsTrigger>
            <TabsTrigger value="applications">Aplikasi Sewa</TabsTrigger>
            <TabsTrigger value="transactions">Transaksi</TabsTrigger>
            <TabsTrigger value="lease-agreements">Kontrak Sewa</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Properti Saya</h2>
              <Button onClick={() => setShowAddProperty(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Properti
              </Button>
            </div>

            {showAddProperty && (
              <Card>
                <CardHeader>
                  <CardTitle>Tambah Properti Baru</CardTitle>
                </CardHeader>
                <CardContent>
                  <AddPropertyForm
                    landlordId={user.id}
                    onSuccess={handlePropertyAdded}
                    onCancel={() => setShowAddProperty(false)}
                  />
                </CardContent>
              </Card>
            )}

            {properties.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    Belum ada properti. Tambahkan properti pertama Anda!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <Card key={property.id}>
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                      <img
                        src={
                          property.image_1 ||
                          `/placeholder.svg?height=200&width=300&query=${
                            encodeURIComponent(property.title) ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg"
                          }`
                        }
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant={
                            property.is_available ? "default" : "secondary"
                          }
                        >
                          {property.is_available
                            ? "Tersedia"
                            : "Tidak Tersedia"}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">
                          {property.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {property.description}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <strong>Tipe:</strong> {property.property_type}
                          </div>
                          <div>
                            <strong>Luas:</strong> {property.area_sqm} m²
                          </div>
                          <div>
                            <strong>Kamar:</strong> {property.bedrooms}
                          </div>
                          <div>
                            <strong>Kamar Mandi:</strong> {property.bathrooms}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">
                              Harga IDR:
                            </span>
                            <span className="text-sm">
                              {formatIDR(property.price_per_month_idr)}/bulan
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">
                              Harga ETH:
                            </span>
                            <span className="text-sm">
                              {formatETH(property.price_per_month_eth)}/bulan
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">
                              Pricing:
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {property.pricing_type === "fixed" && "Fixed"}
                              {property.pricing_type === "tiered" && "Tiered"}
                              {property.pricing_type === "dynamic" && "Dynamic"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant={
                              property.is_available ? "outline" : "default"
                            }
                            onClick={() =>
                              handleToggleAvailability(
                                property.id,
                                property.is_available
                              )
                            }
                            className="flex-1"
                          >
                            {property.is_available ? "Nonaktifkan" : "Aktifkan"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applications" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Aplikasi Penyewaan</h2>
            </div>

            {applications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    Belum ada aplikasi sewa.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <Card key={application.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {application.properties?.title}
                            </h3>
                            <Badge
                              variant={
                                application.is_approved === true
                                  ? "default"
                                  : application.is_approved === false
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {application.is_approved === true
                                ? "Disetujui"
                                : application.is_approved === false
                                ? "Ditolak"
                                : "Pending"}
                            </Badge>
                            {application.is_paid && (
                              <Badge variant="default" className="bg-green-500">
                                Dibayar
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <strong>Penyewa:</strong>{" "}
                              {application.tenant_name}
                            </div>
                            <div>
                              <strong>Durasi:</strong> {application.duration}{" "}
                              bulan
                            </div>
                            <div>
                              <strong>Total:</strong>{" "}
                              {formatIDR(application.total_amount_idr)}
                            </div>
                            <div>
                              <strong>Penghasilan:</strong>{" "}
                              {formatIDR(application.tenant_income)}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div>
                              <strong>Email:</strong> {application.tenant_email}
                            </div>
                            <div>
                              <strong>Telepon:</strong>{" "}
                              {application.tenant_phone}
                            </div>
                            <div>
                              <strong>Pekerjaan:</strong>{" "}
                              {application.tenant_occupation}
                            </div>
                          </div>

                          {application.message && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <strong className="text-sm">Pesan:</strong>
                              <p className="text-sm text-muted-foreground mt-1">
                                {application.message}
                              </p>
                            </div>
                          )}

                          {application.is_approved === true && (
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                              <p className="text-sm text-green-800">
                                <strong>Status:</strong> Aplikasi telah
                                disetujui dan kontrak sewa telah dibuat.
                                {application.is_paid
                                  ? " Pembayaran telah diterima."
                                  : " Kontrak telah aktif."}
                              </p>
                            </div>
                          )}

                          {application.is_approved === false && (
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                              <p className="text-sm text-red-800">
                                <strong>Status:</strong> Aplikasi telah ditolak.
                                Penyewa dapat mengajukan aplikasi baru untuk
                                properti lain.
                              </p>
                            </div>
                          )}
                        </div>

                        {application.is_approved === null && (
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleApproveApplication(application.id)
                              }
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Setujui & Aktifkan Pembayaran
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleRejectApplication(application.id)
                              }
                            >
                              Tolak
                            </Button>
                          </div>
                        )}

                        {application.is_approved === false && (
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleResetApplication(application.id)
                              }
                            >
                              Reset ke Pending
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <h2 className="text-2xl font-bold">Riwayat Transaksi</h2>

            {transactions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Belum ada transaksi.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold">
                            {transaction.rental_applications?.properties?.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm">
                            <span>
                              <strong>Dari:</strong>{" "}
                              {transaction.rental_applications?.tenant_name}
                            </span>
                            <span>
                              <strong>Jumlah:</strong>{" "}
                              {formatIDR(transaction.amount_idr)}
                            </span>
                            <span>
                              <strong>Tipe:</strong> {transaction.payment_type}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>
                              Wallet:{" "}
                              {`${transaction.tenant_wallet.slice(
                                0,
                                6
                              )}...${transaction.tenant_wallet.slice(-4)}`}
                            </p>
                            <p>
                              Tanggal:{" "}
                              {new Date(
                                transaction.created_at
                              ).toLocaleDateString("id-ID")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="default" className="bg-green-500">
                            Selesai
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            <a
                              href={`https://sepolia.etherscan.io/tx/${transaction.transaction_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              Lihat di Etherscan
                            </a>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="lease-agreements" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Kontrak Sewa</h2>
            </div>

            {leaseAgreements.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    Belum ada kontrak sewa.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {leaseAgreements.map((lease) => (
                  <Card key={lease.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {lease.rental_applications?.properties?.title}
                            </h3>
                            <Badge
                              variant={
                                lease.status === "approved"
                                  ? "default"
                                  : lease.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {lease.status === "approved"
                                ? "Aktif"
                                : lease.status === "rejected"
                                ? "Ditolak"
                                : "Menunggu"}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground">
                            {lease.rental_applications?.properties?.location}
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <strong>Penyewa:</strong>{" "}
                              {lease.rental_applications?.tenant_name}
                            </div>
                            <div>
                              <strong>Durasi:</strong>{" "}
                              {lease.rental_applications?.duration} bulan
                            </div>
                            <div>
                              <strong>Sewa Bulanan:</strong>{" "}
                              {formatIDR(lease.monthly_rent_idr)}
                            </div>
                            <div>
                              <strong>Deposit:</strong>{" "}
                              {formatIDR(lease.security_deposit_idr)}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>
                              <strong>Mulai:</strong>{" "}
                              {new Date(
                                lease.lease_start_date
                              ).toLocaleDateString("id-ID")}
                            </div>
                            <div>
                              <strong>Berakhir:</strong>{" "}
                              {new Date(
                                lease.lease_end_date
                              ).toLocaleDateString("id-ID")}
                            </div>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg">
                            <strong className="text-sm">
                              Syarat & Ketentuan:
                            </strong>
                            <p className="text-sm text-muted-foreground mt-1">
                              {lease.terms_and_conditions}
                            </p>
                          </div>

                          {lease.approved_at && (
                            <div className="text-sm text-green-600">
                              <strong>Disetujui pada:</strong>{" "}
                              {new Date(lease.approved_at).toLocaleDateString(
                                "id-ID"
                              )}
                            </div>
                          )}

                          {lease.status === "approved" && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-800">
                                <strong>Status:</strong> Kontrak sewa aktif.
                                Penyewa dapat melakukan pembayaran langsung.
                              </p>
                            </div>
                          )}
                        </div>

                        {lease.status === "pending" && (
                          <div className="flex items-center gap-2 ml-4">
                            {/* Removed manual lease agreement approval buttons */}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
