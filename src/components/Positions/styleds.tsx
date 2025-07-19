import { Grid } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress';
import styled from '@emotion/styled'

export const GridStyled = styled(Grid)`
  min-height: 42px;
  display: flex;
  align-items: center;
`

export const GradientCircularProgress = ({width = '20px' }: {width?: string}) => {
  return (
    <>
      <svg width={0} height={0}>
        <defs>
          <linearGradient id="my_gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e01cd5" />
            <stop offset="100%" stopColor="#1CB5E0" />
          </linearGradient>
        </defs>
      </svg>
      <CircularProgress sx={{ width: `${width} !important`, height: `${width} !important`, 'svg circle': { stroke: 'url(#my_gradient)' } }} />
    </>
  );
}