"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useWallet } from "@/contexts/wallet-context";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { PropertyDetails } from "@/components/property-details";
import { RentalApplicationForm } from "@/components/rental-application-form";
import { ApplicationStatus } from "@/components/application-status";
import type { PropertyApiResponse } from "@/lib/types";

interface Application {
  id: string;
  property_id: string;
  tenant_wallet: string;
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string;
  duration: number;
  total_amount: number;
  total_amount_idr: number;
  is_approved: boolean;
  is_paid: boolean;
  created_at: string;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { address, isConnected } = useWallet();
  const [property, setProperty] = useState<PropertyApiResponse | null>(null);
  const [userApplication, setUserApplication] = useState<Application | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadPropertyDetails();
    }
  }, [params.id]);

  useEffect(() => {
    if (address && property) {
      checkUserApplication();
    }
  }, [address, property]);

  const loadPropertyDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/properties/${params.id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setProperty(result.data);
      } else {
        throw new Error(result.error || "Failed to load property details");
      }
    } catch (error) {
      console.error("Error loading property:", error);
      toast({
        title: "Error",
        description: "Gagal memuat detail properti",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkUserApplication = async () => {
    if (!address || !property) return;

    try {
      const response = await fetch(
        `/api/rental-applications?tenant_wallet=${address}&property_id=${property.id}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const latestApplication = result.data[0];

        const canCreateNewApplication =
          latestApplication.is_approved === false ||
          latestApplication.is_paid === true;

        if (!canCreateNewApplication) {
          setUserApplication(latestApplication);
        }
      }
    } catch (error) {
      console.error("Error checking user application:", error);
    }
  };

  const handleApplicationSubmitted = () => {
    checkUserApplication();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Properti Tidak Ditemukan</h1>
          <Link href="/">
            <Button>Kembali ke Beranda</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Sample additional images
  const additionalImages = [
    `/placeholder.svg?height=300&width=400&query=${encodeURIComponent(
      property.title + " bedroom"
    )}`,
    `/placeholder.svg?height=300&width=400&query=${encodeURIComponent(
      property.title + " bathroom"
    )}`,
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Properti
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Property Details - 2/3 width on large screens */}
        <div className="lg:col-span-2">
          <PropertyDetails
            property={property}
            additionalImages={additionalImages}
          />
        </div>

        {/* Application Form or Status - 1/3 width on large screens */}
        <div>
          {userApplication ? (
            <ApplicationStatus
              application={userApplication}
              propertyId={property.id}
            />
          ) : (
            <RentalApplicationForm
              property={property}
              onSubmitSuccess={handleApplicationSubmitted}
            />
          )}
        </div>
      </div>
    </div>
  );
}
