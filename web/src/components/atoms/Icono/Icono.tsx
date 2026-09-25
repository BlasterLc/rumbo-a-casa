import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material';
import CheckRounded from '@mui/icons-material/CheckRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import InfoRounded from '@mui/icons-material/InfoRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import MicRounded from '@mui/icons-material/MicRounded';
import VolumeUpRounded from '@mui/icons-material/VolumeUpRounded';
import ChatBubbleOutlineRounded from '@mui/icons-material/ChatBubbleOutlineRounded';
import HomeRounded from '@mui/icons-material/HomeRounded';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import NotificationsRounded from '@mui/icons-material/NotificationsRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import VerifiedUserRounded from '@mui/icons-material/VerifiedUserRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import RemoveRounded from '@mui/icons-material/RemoveRounded';
import AccountBalanceRounded from '@mui/icons-material/AccountBalanceRounded';

export type NombreIcono =
  | 'check' | 'reloj' | 'alerta' | 'info' | 'cerrar' | 'atras' | 'mic' | 'parlante'
  | 'chat' | 'casa' | 'papel' | 'campana' | 'externo' | 'escudo' | 'abajo' | 'menos' | 'banco';

const MAPA: Record<NombreIcono, ComponentType<SvgIconProps>> = {
  check: CheckRounded,
  reloj: ScheduleRounded,
  alerta: WarningAmberRounded,
  info: InfoRounded,
  cerrar: CloseRounded,
  atras: ArrowBackRounded,
  mic: MicRounded,
  parlante: VolumeUpRounded,
  chat: ChatBubbleOutlineRounded,
  casa: HomeRounded,
  papel: DescriptionRounded,
  campana: NotificationsRounded,
  externo: OpenInNewRounded,
  escudo: VerifiedUserRounded,
  abajo: ExpandMoreRounded,
  menos: RemoveRounded,
  banco: AccountBalanceRounded,
};

export const NOMBRES_ICONO = Object.keys(MAPA) as NombreIcono[];

export interface IconoProps extends Omit<SvgIconProps, 'fontSize'> {
  nombre: NombreIcono;
  tamano?: number;
  grosor?: number;
}

/** Juego mínimo al estilo Material Symbols Rounded, peso 400, sin relleno. Hereda color con currentColor. */
export function Icono({ nombre, tamano = 24, grosor, sx, ...props }: IconoProps) {
  const Cmp = MAPA[nombre];
  return <Cmp sx={{ fontSize: tamano, strokeWidth: grosor, ...sx }} {...props} />;
}
