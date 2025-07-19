import {
  Box,
  FormControlLabel,
  Dialog,
  Button,
  DialogContent,
  DialogActions,
  DialogTitle,
  Checkbox,
} from '@mui/material'

export interface ConfirmationDialogRawProps {
  exchanges: string[]
  id: string
  keepMounted: boolean
  open: boolean
  onClose: (value?: string) => void
  setSelectedExchanges: (exchanges: string[]) => void
  selectedExchanges: string[]
}

function FilterDialog(props: ConfirmationDialogRawProps) {
  const {
    onClose,
    open,
    selectedExchanges,
    setSelectedExchanges,
    exchanges,
    ...other
  } = props

  const handleCancel = () => {
    onClose()
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedExchanges([...selectedExchanges, event.target.name])
    } else {
      setSelectedExchanges(
        selectedExchanges.filter((ex) => ex !== event.target.name)
      )
    }
  }
  return (
    <Dialog fullScreen maxWidth="xl" open={open} {...other}>
      <DialogTitle sx={{ fontSize: 16 }}>Filter</DialogTitle>
      <DialogContent dividers sx={{ padding: '16px 12px' }}>
        <Box
          display="flex"
          alignItems="flex-start"
          justifyContent="space-between"
          flexDirection="column"
        >
          {exchanges.map((exchange) => {
            return (
              <FormControlLabel
                key={exchange}
                control={
                  <Checkbox
                    checked={selectedExchanges.includes(exchange)}
                    name={exchange}
                    onChange={handleChange}
                    inputProps={{ 'aria-label': 'controlled' }}
                  />
                }
                label={exchange}
              />
            )
          })}
        </Box>
      </DialogContent>
      <DialogActions sx={{ width: '100%' }}>
        <Box
          width="100%"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          py={1}
        >
          <Button autoFocus onClick={handleCancel}>
            Close
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default FilterDialog

export const capitalize = (s: string) =>
  (s && s[0].toUpperCase() + s.slice(1)) || ''
