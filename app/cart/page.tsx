"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, Trash2, CreditCard, ShoppingBag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { toast } from "@/components/ui/use-toast"

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<any[]>([])
  const [couponCode, setCouponCode] = useState("")
  const [discount, setDiscount] = useState(0)
  const [userId, setUserId] = useState<number | null>(null)

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me")
        const result = await response.json()
        if (result?.user?.id) {
          setUserId(result.user.id)
        } else {
          setUserId(1)
        }
      } catch {
        setUserId(1)
      }
    }

    const loadCart = async () => {
      const currentUserId = userId ?? 1
      const response = await fetch(`/api/cart?userId=${currentUserId}`)
      const data = await response.json()
      setCartItems(data)
    }

    loadCurrentUser().finally(() => {
      loadCart()
    })
  }, [userId])

  const updateQuantity = async (id: number, change: number) => {
    const currentItem = cartItems.find((item) => item.id === id)
    if (!currentItem) return

    const newQuantity = currentItem.quantity + change
    if (newQuantity < 1) return

    const response = await fetch("/api/cart", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId ?? 1,
        productId: id,
        quantity: newQuantity,
      }),
    })

    if (!response.ok) {
      toast({
        title: "Cart update failed",
        description: "Unable to update the cart.",
      })
      return
    }

    const updatedCart = cartItems.map((item) => {
      if (item.id === id) {
        return { ...item, quantity: newQuantity }
      }
      return item
    })

    setCartItems(updatedCart)
    window.dispatchEvent(new Event("storage"))
  }

  const removeItem = async (id: number) => {
    const response = await fetch("/api/cart", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId ?? 1,
        productId: id,
      }),
    })

    if (!response.ok) {
      toast({
        title: "Remove failed",
        description: "Unable to remove item from cart.",
      })
      return
    }

    const updatedCart = cartItems.filter((item) => item.id !== id)
    setCartItems(updatedCart)

    toast({
      title: "Item removed",
      description: "The item has been removed from your cart",
    })

    window.dispatchEvent(new Event("storage"))
  }

  const applyCoupon = () => {
    if (couponCode.toLowerCase() === "discount10") {
      setDiscount(10)
      toast({
        title: "Coupon applied",
        description: "10% discount has been applied to your order",
      })
    } else if (couponCode.toLowerCase() === "discount20") {
      setDiscount(20)
      toast({
        title: "Coupon applied",
        description: "20% discount has been applied to your order",
      })
    } else {
      toast({
        title: "Invalid coupon",
        description: "The coupon code you entered is invalid",
      })
    }
  }

  const handleCheckout = () => {
    router.push("/checkout")
  }

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const shipping = subtotal > 100 ? 0 : 10 // Free shipping over $100
  const discountAmount = (subtotal * discount) / 100
  const tax = (subtotal - discountAmount) * 0.1 // 10% tax
  const total = subtotal - discountAmount + shipping + tax

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container px-4 py-6 md:px-6 md:py-8">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>Shopping Cart</span>
          </div>

          <h1 className="mt-6 text-2xl font-bold md:text-3xl">Shopping Cart</h1>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {cartItems.length > 0 ? (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="rounded-lg border p-4">
                      <div className="flex gap-4">
                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border">
                          <Image
                            src={item.image || "/placeholder.svg?height=100&width=100"}
                            alt={item.name}
                            width={100}
                            height={100}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between">
                            <Link href={`/product/${item.id}`} className="text-lg font-medium hover:text-primary">
                              {item.name}
                            </Link>
                            <p className="text-lg font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, -1)}
                                disabled={item.quantity <= 1}
                              >
                                -
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                +
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border p-8">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground" />
                  <h2 className="mt-4 text-xl font-medium">Your cart is empty</h2>
                  <p className="mt-2 text-center text-muted-foreground">
                    Looks like you haven't added anything to your cart yet.
                  </p>
                  <Link href="/" className="mt-4">
                    <Button>Continue Shopping</Button>
                  </Link>
                </div>
              )}
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({discount}%)</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Apply Coupon Code</span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <Button variant="outline" onClick={applyCoupon}>
                        Apply
                      </Button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Try: DISCOUNT10 or DISCOUNT20</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full gap-2" size="lg" onClick={handleCheckout} disabled={cartItems.length === 0}>
                    <CreditCard className="h-5 w-5" />
                    Proceed to Checkout
                  </Button>
                </CardFooter>
              </Card>

              <div className="mt-4 rounded-lg border p-4">
                <h3 className="font-medium">We Accept</h3>
                <div className="mt-2 flex gap-2">
                  <div className="h-8 w-12 rounded bg-muted flex items-center justify-center text-xs font-medium">
                    Visa
                  </div>
                  <div className="h-8 w-12 rounded bg-muted flex items-center justify-center text-xs font-medium">
                    MC
                  </div>
                  <div className="h-8 w-12 rounded bg-muted flex items-center justify-center text-xs font-medium">
                    Amex
                  </div>
                  <div className="h-8 w-12 rounded bg-muted flex items-center justify-center text-xs font-medium">
                    PayPal
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

