"use client";

import { useState } from "react";

type ProductDetails = {
  productName: string;
  brand: string;
  netQuantity: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  ingredients: string;
};

type ApiResult = {
  success?: boolean;
  error?: string;
  extractedText?: string;
  productName?: string;
  brand?: string;
  netQuantity?: string;
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  ingredients?: string;
  complianceStatus?: string;
  message?: string;
};

const emptyDetails: ProductDetails = {
  productName: "Not detected",
  brand: "Not detected",
  netQuantity: "Not detected",
  batchNumber: "Not detected",
  manufacturingDate: "Not detected",
  expiryDate: "Not detected",
  ingredients: "Not detected",
};

