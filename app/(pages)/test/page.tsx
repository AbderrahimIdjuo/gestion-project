"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function OrderDialog() {
  const [open, setOpen] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [supplier, setSupplier] = useState("")
  const [orderGroups, setOrderGroups] = useState([])

  // Sample data for dropdowns
  const suppliers = ["Supplier 1", "Supplier 2", "Supplier 3"]
  const invoiceNumbers = ["INV-001", "INV-002", "INV-003", "INV-004"]
  const clientNames = {
    "INV-001": "Client A",
    "INV-002": "Client B",
    "INV-003": "Client C",
    "INV-004": "Client D",
  }
  const availableProducts = [
    { id: "p1", name: "Product 1" },
    { id: "p2", name: "Product 2" },
    { id: "p3", name: "Product 3" },
    { id: "p4", name: "Product 4" },
  ]

  const addOrderGroup = () => {
    const newGroup = {
      id: `group-${orderGroups.length + 1}`,
      invoiceNumber: "",
      clientName: "",
      products: [],
    }
    setOrderGroups([...orderGroups, newGroup])
  }

  const updateOrderGroup = (id, field, value) => {
    setOrderGroups(
      orderGroups.map((group) => {
        if (group.id === id) {
          if (field === "invoiceNumber") {
            return {
              ...group,
              [field]: value,
              clientName: clientNames[value] || "",
            }
          }
          return { ...group, [field]: value }
        }
        return group
      }),
    )
  }

  const addProduct = (groupId) => {
    setOrderGroups(
      orderGroups.map((group) => {
        if (group.id === groupId) {
          // Add a default product
          const newProduct = {
            id: `product-${group.products.length + 1}`,
            name: availableProducts[0].name,
            quantity: 1,
          }
          return { ...group, products: [...group.products, newProduct] }
        }
        return group
      }),
    )
  }

  const updateProduct = (groupId, productId, field, value) => {
    setOrderGroups(
      orderGroups.map((group) => {
        if (group.id === groupId) {
          const updatedProducts = group.products.map((product) => {
            if (product.id === productId) {
              return { ...product, [field]: value }
            }
            return product
          })
          return { ...group, products: updatedProducts }
        }
        return group
      }),
    )
  }

  const removeProduct = (groupId, productId) => {
    setOrderGroups(
      orderGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            products: group.products.filter((p) => p.id !== productId),
          }
        }
        return group
      }),
    )
  }

  const removeOrderGroup = (groupId) => {
    setOrderGroups(orderGroups.filter((group) => group.id !== groupId))
  }

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Order Dialog</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Order</DialogTitle>
          </DialogHeader>

          <div className="flex justify-between items-center mb-4">
            <div className="w-1/2 pr-2">
              <label className="text-sm font-medium mb-1 block">Supplier</label>
              <Select value={supplier} onValueChange={setSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-1/2 pl-2">
              <label className="text-sm font-medium mb-1 block">Order Number</label>
              <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="Order number" />
            </div>
          </div>

          <Button onClick={addOrderGroup} className="mb-4" variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Add Order Group
          </Button>

          <div className="space-y-4">
            {orderGroups.map((group) => (
              <Card key={group.id}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <div className="w-1/2 pr-2">
                      <label className="text-sm font-medium mb-1 block">Invoice Number</label>
                      <Select
                        value={group.invoiceNumber}
                        onValueChange={(value) => updateOrderGroup(group.id, "invoiceNumber", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select invoice" />
                        </SelectTrigger>
                        <SelectContent>
                          {invoiceNumbers.map((inv) => (
                            <SelectItem key={inv} value={inv}>
                              {inv}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-1/2 pl-2">
                      <label className="text-sm font-medium mb-1 block">Client Name</label>
                      <Input value={group.clientName} readOnly placeholder="Client name will appear here" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="flex justify-between mb-4">
                    <Button onClick={() => addProduct(group.id)} variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                    <Button onClick={() => removeOrderGroup(group.id)} variant="destructive" size="sm">
                      Annuler
                    </Button>
                  </div>

                  {group.products.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <Select
                                value={product.name}
                                onValueChange={(value) => updateProduct(group.id, product.id, "name", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableProducts.map((p) => (
                                    <SelectItem key={p.id} value={p.name}>
                                      {p.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={product.quantity}
                                onChange={(e) =>
                                  updateProduct(group.id, product.id, "quantity", Number.parseInt(e.target.value) || 1)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => removeProduct(group.id, product.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button>Save Order</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
