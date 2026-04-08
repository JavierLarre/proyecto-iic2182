import { useState } from 'react';
import { Marker } from 'react-map-gl/maplibre';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClusterMarkerProps {
  lng: number;
  lat: number;
  count: number;
  nombre?: string;
  onClick?: () => void;
}

export function ClusterMarker({ lng, lat, count, nombre, onClick }: ClusterMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isClickable = count === 1 && onClick;

  const handleClick = (e: React.MouseEvent) => {
    if (isClickable) {
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <Marker longitude={lng} latitude={lat} anchor="center" style={{ zIndex: 100 }}>
      <div
        className="relative cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <div className={cn(
          "w-8 h-8 rounded-full",
          "bg-white shadow-lg",
          "border-2 border-blue-500",
          "flex items-center justify-center",
          "transition-transform duration-200 ease-out",
          isHovered && "scale-110"
        )}>
          <Building2 className="h-4 w-4 text-blue-600" />
        </div>

        {count > 1 && (
          <div className={cn(
            "absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1",
            "rounded-full text-[11px] font-bold",
            "flex items-center justify-center",
            "border-2 border-white shadow-md",
            "bg-blue-600 text-white"
          )}>
            {count > 99 ? '99+' : count}
          </div>
        )}

        <div className={cn(
          "absolute bottom-full left-1/2 -translate-x-1/2 mb-2",
          "bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap",
          "transition-all duration-200 max-w-48 truncate",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
        )}>
          {count > 1 ? `${count} proveedores` : nombre || 'Proveedor'}
        </div>
      </div>
    </Marker>
  );
}
