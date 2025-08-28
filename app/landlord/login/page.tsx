"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, Mail, Lock, User } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function LandlordLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    walletAddress: "",
    phone: "",
    address: "",
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("Attempting login with:", loginData.email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      if (error) {
        console.error("Login error:", error)
        throw error
      }

      console.log("Login successful:", data)

      // Check if landlord exists in our landlords table
      const { data: landlord, error: landlordError } = await supabase
        .from("landlords")
        .select("*")
        .eq("id", data.user.id)
        .single()

      if (landlordError || !landlord) {
        console.error("Landlord not found:", landlordError)
        toast({
          title: "Error",
          description: "Akun landlord tidak ditemukan. Silakan hubungi administrator.",
          variant: "destructive",
        })
        await supabase.auth.signOut()
        return
      }

      toast({
        title: "Login Berhasil",
        description: `Selamat datang, ${landlord.name}!`,
      })

      router.push("/landlord/dashboard")
    } catch (error: any) {
      console.error("Login error:", error)
      let errorMessage = "Email atau password salah"

      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Email atau password salah. Pastikan Anda sudah registrasi terlebih dahulu."
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Email belum dikonfirmasi. Silakan cek email Anda atau hubungi admin."
      }

      toast({
        title: "Login Gagal",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const validDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"]
    const domain = email.split("@")[1]

    if (!emailRegex.test(email)) {
      return "Format email tidak valid"
    }

    if (!validDomains.includes(domain)) {
      return "Gunakan email dari provider yang valid (Gmail, Yahoo, Outlook, dll)"
    }

    return null
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validasi email
    const emailError = validateEmail(registerData.email)
    if (emailError) {
      toast({
        title: "Error",
        description: emailError,
        variant: "destructive",
      })
      return
    }

    // Validasi form
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Error",
        description: "Password dan konfirmasi password tidak sama",
        variant: "destructive",
      })
      return
    }

    if (registerData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password minimal 6 karakter",
        variant: "destructive",
      })
      return
    }

    if (!registerData.walletAddress.startsWith("0x") || registerData.walletAddress.length !== 42) {
      toast({
        title: "Error",
        description: "Format wallet address tidak valid (harus 0x... dengan 42 karakter)",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      console.log("Attempting registration with:", registerData.email)

      // 1. Create auth user dengan auto-confirm
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            name: registerData.name,
            wallet_address: registerData.walletAddress,
          },
          // Ini akan mencoba auto-confirm jika diizinkan oleh Supabase settings
          emailRedirectTo: undefined,
        },
      })

      if (authError) {
        console.error("Auth registration error:", authError)

        let errorMessage = "Terjadi kesalahan saat registrasi"
        if (authError.message?.includes("sudah teregistrasi")) {
          errorMessage = "Email sudah terdaftar. Silakan gunakan email lain atau login."
        } else if (authError.message?.includes("tidak valid")) {
          errorMessage = "Format email tidak valid. Gunakan email dari Gmail, Yahoo, atau Outlook."
        }

        throw new Error(errorMessage)
      }

      if (!authData.user) {
        throw new Error("Failed to create user")
      }

      console.log("Auth user created:", authData.user.id)

      // 2. Insert landlord data
      const { error: landlordError } = await supabase.from("landlords").insert({
        id: authData.user.id,
        email: registerData.email,
        name: registerData.name,
        wallet_address: registerData.walletAddress,
        phone: registerData.phone || null,
        address: registerData.address || null,
      })

      if (landlordError) {
        console.error("Landlord insert error:", landlordError)
        throw new Error("Gagal menyimpan data landlord: " + landlordError.message)
      }

      console.log("Landlord data inserted successfully")

      // 3. Coba auto-login jika user sudah confirmed
      if (authData.user.email_confirmed_at || authData.session) {
        toast({
          title: "Registrasi Berhasil!",
          description: `Selamat datang, ${registerData.name}!`,
        })

        // Langsung redirect ke dashboard
        router.push("/landlord/dashboard")
        return
      }

      // 4. Jika belum confirmed, tampilkan pesan dan pindah ke login
      toast({
        title: "Registrasi Berhasil!",
        description: "Akun berhasil dibuat. Silakan login dengan email dan password yang sama.",
      })

      // Clear form dan pindah ke login
      setLoginData({
        email: registerData.email,
        password: registerData.password,
      })

      setRegisterData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        walletAddress: "",
        phone: "",
        address: "",
      })

      // Switch to login tab
      const loginTab = document.querySelector('[data-value="login"]') as HTMLElement
      if (loginTab) {
        loginTab.click()
      }

      // Auto-submit login form setelah 1 detik
      setTimeout(() => {
        const loginForm = document.querySelector("form") as HTMLFormElement
        if (loginForm) {
          loginForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
        }
      }, 1000)
    } catch (error: any) {
      console.error("Registration error:", error)
      toast({
        title: "Registrasi Gagal",
        description: error.message || "Terjadi kesalahan saat registrasi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-bold text-blue-600 hover:text-blue-700"
          >
            <Home className="h-8 w-8" />
            RentChain
          </Link>
          <p className="text-muted-foreground mt-2">Landlord Portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Akses Landlord</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="register" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-value="login">
                  Masuk
                </TabsTrigger>
                <TabsTrigger value="register" data-value="register">
                  Daftar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="pl-10"
                        placeholder="masukkan email Anda"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="pl-10"
                        placeholder="masukkan password"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Masuk ke akun..." : "Masuk"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <div className="space-y-4">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label htmlFor="register-name">Nama Lengkap *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-name"
                          value={registerData.name}
                          onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                          className="pl-10"
                          placeholder="Masukkan nama lengkap Anda"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="register-email">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-email"
                          type="email"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          className="pl-10"
                          placeholder="Masukkan email Anda"
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Gunakan Gmail, Yahoo, Outlook, atau provider email valid lainnya
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="register-wallet">Wallet Address *</Label>
                      <Input
                        id="register-wallet"
                        value={registerData.walletAddress}
                        onChange={(e) => setRegisterData({ ...registerData, walletAddress: e.target.value })}
                        placeholder="Masukkan alamat wallet MetaMask Anda"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Alamat wallet MetaMask Anda (42 karakter, dimulai dengan 0x)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="register-phone">Nomor Telepon</Label>
                      <Input
                        id="register-phone"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                        placeholder="Masukkan nomor telepon Anda"
                      />
                    </div>

                    <div>
                      <Label htmlFor="register-address">Alamat</Label>
                      <Input
                        id="register-address"
                        value={registerData.address}
                        onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                        placeholder="Masukkan alamat lengkap Anda"
                      />
                    </div>

                    <div>
                      <Label htmlFor="register-password">Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-password"
                          type="password"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          className="pl-10"
                          placeholder="minimal 6 karakter"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="register-confirm-password">Konfirmasi Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-confirm-password"
                          type="password"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                          className="pl-10"
                          placeholder="ulangi password"
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating Account..." : "Daftar"}
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  )
}
