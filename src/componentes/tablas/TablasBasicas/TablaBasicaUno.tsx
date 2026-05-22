/**
 * COMPONENTE: BasicTableOne
 * FUNCIÓN TRIBUTARIA: Historial general de clientes y facturación de proyectos,
 * detallando el tipo de comprobante, operadores asignados y estado de validación SRI.
 */
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import Badge from "../../ui/insignia/Insignia";

interface Order {
  id: number;
  user: {
    image: string;
    name: string;
    role: string;
  };
  projectName: string;
  team: {
    images: string[];
  };
  status: string;
  budget: string;
}

// Default Ecuatorianized and SRI-compliant invoices history
const defaultInvoices: Order[] = [
  {
    id: 1,
    user: {
      image: "/images/user/user-17.jpg",
      name: "Lindsey Curtis",
      role: "RUC: 1792345678001",
    },
    projectName: "Factura - Sombrero de Paja Toquilla x 2",
    team: {
      images: [
        "/images/user/user-22.jpg",
        "/images/user/user-23.jpg",
        "/images/user/user-24.jpg",
      ],
    },
    budget: "$103.50",
    status: "Autorizado",
  },
  {
    id: 2,
    user: {
      image: "/images/user/user-18.jpg",
      name: "Kaiya George",
      role: "RUC: 0991234567001",
    },
    projectName: "Factura - Café de Loja Premium x 5",
    team: {
      images: ["/images/user/user-25.jpg", "/images/user/user-26.jpg"],
    },
    budget: "$37.38",
    status: "Pendiente",
  },
  {
    id: 3,
    user: {
      image: "/images/user/user-17.jpg",
      name: "Zain Geidt",
      role: "RUC: 0103456789001",
    },
    projectName: "Factura - Laptop (Servicio Técnico) x 1",
    team: {
      images: ["/images/user/user-27.jpg"],
    },
    budget: "$97.75",
    status: "Autorizado",
  },
  {
    id: 4,
    user: {
      image: "/images/user/user-20.jpg",
      name: "Abram Schleifer",
      role: "RUC: 1801234567001",
    },
    projectName: "Factura - Chocolate Pacari Organic x 10",
    team: {
      images: [
        "/images/user/user-28.jpg",
        "/images/user/user-29.jpg",
        "/images/user/user-30.jpg",
      ],
    },
    budget: "$55.20",
    status: "Anulado",
  },
  {
    id: 5,
    user: {
      image: "/images/user/user-21.jpg",
      name: "Carla George",
      role: "RUC: 1729876543001",
    },
    projectName: "Factura - Sombrero de Paja Toquilla x 1",
    team: {
      images: [
        "/images/user/user-31.jpg",
        "/images/user/user-32.jpg",
        "/images/user/user-33.jpg",
      ],
    },
    budget: "$51.75",
    status: "Autorizado",
  },
];

interface BasicTableOneProps {
  invoices?: Order[];
}

export default function BasicTableOne({ invoices }: BasicTableOneProps) {
  const [localInvoices, setLocalInvoices] = useState<Order[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("pos_invoices");
    if (stored) {
      try {
        setLocalInvoices(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing pos_invoices from localStorage", e);
        setLocalInvoices(defaultInvoices);
      }
    } else {
      localStorage.setItem("pos_invoices", JSON.stringify(defaultInvoices));
      setLocalInvoices(defaultInvoices);
    }
  }, [invoices]);

  const displayInvoices = invoices !== undefined ? invoices : localInvoices;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Cliente Registrado
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Tipo de Comprobante
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Operadores
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Estado SRI
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Total Facturado
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {displayInvoices.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 overflow-hidden rounded-full flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <img
                        width={40}
                        height={40}
                        src={order.user.image || "/images/user/user-17.jpg"}
                        alt={order.user.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/user/user-17.jpg";
                        }}
                      />
                    </div>
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {order.user.name}
                      </span>
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                        {order.user.role}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {order.projectName}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <div className="flex -space-x-2">
                    {(order.team?.images || ["/images/user/user-22.jpg", "/images/user/user-23.jpg"]).map((teamImage, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 overflow-hidden border-2 border-white rounded-full dark:border-gray-900"
                      >
                        <img
                          width={24}
                          height={24}
                          src={teamImage}
                          alt={`Team member ${index + 1}`}
                          className="w-full size-6"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `/images/user/user-${22 + index}.jpg`;
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <Badge
                    size="sm"
                    color={
                      order.status === "Autorizado"
                        ? "success"
                        : order.status === "Pendiente"
                        ? "warning"
                        : "error"
                    }
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400 font-medium">
                  {order.budget}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
