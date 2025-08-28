"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ApplicationStatusProps {
  application: {
    id: string;
    is_approved: boolean | null;
    is_paid: boolean;
    created_at: string;
    tenant_name: string;
    duration: number;
    total_amount_idr: number;
  };
  propertyId: string;
}

export function ApplicationStatus({
  application,
  propertyId,
}: ApplicationStatusProps) {
  const router = useRouter();
  const [leaseStatus, setLeaseStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentApplication, setCurrentApplication] = useState(application);

  useEffect(() => {
    checkLeaseAgreementStatus();
    const interval = setInterval(() => {
      checkApplicationStatus();
      checkLeaseAgreementStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [application.id]);

  const checkApplicationStatus = async () => {
    try {
      const response = await fetch(
        `/api/rental-applications/${application.id}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        if (
          JSON.stringify(result.data) !== JSON.stringify(currentApplication)
        ) {
          setCurrentApplication(result.data);
        }
      }
    } catch (error) {
      console.error("Error checking application status:", error);
    }
  };

  const checkLeaseAgreementStatus = async () => {
    try {
      const response = await fetch(
        `/api/lease-agreements?application_id=${application.id}`
      );
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const newLeaseStatus = result.data[0].status;
        if (newLeaseStatus !== leaseStatus) {
          setLeaseStatus(newLeaseStatus);
        }
      }
    } catch (error) {
      console.error("Error checking lease agreement status:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusConfig = () => {
    if (currentApplication.is_paid) {
      return {
        icon: CheckCircle,
        color: "text-green-500",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        badge: "default" as const,
        badgeColor: "bg-green-500",
        title: "Pembayaran Selesai",
        description:
          "Aplikasi Anda telah disetujui dan pembayaran telah diterima.",
      };
    }

    if (currentApplication.is_approved === true && leaseStatus === "approved") {
      return {
        icon: CheckCircle,
        color: "text-blue-500",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        badge: "default" as const,
        badgeColor: "bg-blue-500",
        title: "Aplikasi Disetujui",
        description:
          "Aplikasi Anda telah disetujui. Silakan lanjutkan dengan pembayaran.",
      };
    }

    if (currentApplication.is_approved === true && leaseStatus === "pending") {
      return {
        icon: Clock,
        color: "text-orange-500",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        badge: "secondary" as const,
        badgeColor: "",
        title: "Menunggu Persetujuan Kontrak",
        description:
          "Aplikasi disetujui. Menunggu landlord menyetujui kontrak sewa untuk mengaktifkan pembayaran.",
      };
    }

    if (currentApplication.is_approved === false) {
      return {
        icon: XCircle,
        color: "text-red-500",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        badge: "destructive" as const,
        badgeColor: "",
        title: "Aplikasi Ditolak",
        description:
          "Aplikasi Anda telah ditolak oleh pemilik. Anda dapat mencari dan mengajukan sewa properti lain.",
      };
    }

    return {
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      badge: "secondary" as const,
      badgeColor: "",
      title: "Menunggu Persetujuan",
      description:
        "Aplikasi Anda sedang ditinjau oleh pemilik. Anda akan mendapat notifikasi real-time.",
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const handlePayment = () => {
    router.push(`/payment/${currentApplication.id}`);
  };

  const canProceedToPayment =
    currentApplication.is_approved === true &&
    leaseStatus === "approved" &&
    !currentApplication.is_paid;

  if (loading) {
    return (
      <Card className="bg-gray-50 border-gray-200 border-2">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${config.color}`} />
          Status Aplikasi
          <Badge variant={config.badge} className={config.badgeColor}>
            {currentApplication.is_paid
              ? "DIBAYAR"
              : currentApplication.is_approved === true &&
                leaseStatus === "approved"
              ? "DISETUJUI"
              : currentApplication.is_approved === false
              ? "DITOLAK"
              : "MENUNGGU"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{config.description}</p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Diajukan pada:</span>
            <p className="font-medium">
              {formatDate(currentApplication.created_at)}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Durasi:</span>
            <p className="font-medium">{currentApplication.duration} bulan</p>
          </div>
        </div>

        {canProceedToPayment && (
          <Button onClick={handlePayment} className="w-full">
            Lanjutkan ke Pembayaran
          </Button>
        )}

        {currentApplication.is_paid && (
          <div className="bg-green-100 p-3 rounded-lg border border-green-200">
            <p className="text-sm text-green-800 font-medium">
              🎉 Selamat! Sewa Anda telah dikonfirmasi.
            </p>
            <div className="mt-3">
              <Link href="/">
                <Button size="sm" variant="outline" className="w-full bg-white">
                  Sewa Properti Lain
                </Button>
              </Link>
            </div>
          </div>
        )}

        {currentApplication.is_approved === false && (
          <div className="bg-red-100 p-3 rounded-lg border border-red-200">
            <p className="text-sm text-red-800 font-medium mb-2">
              ❌ Aplikasi ditolak oleh pemilik.
            </p>
            <Link href="/">
              <Button size="sm" variant="outline" className="w-full bg-white">
                Cari Properti Lain
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
