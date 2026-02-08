import { Font } from '@react-pdf/renderer'

let registered = false

export function registerFonts() {
  if (registered) return
  registered = true

  Font.register({
    family: 'Inter',
    fonts: [
      {
        src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2',
        fontWeight: 400,
      },
      {
        src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiA.woff2',
        fontWeight: 500,
      },
      {
        src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hiA.woff2',
        fontWeight: 600,
      },
      {
        src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiA.woff2',
        fontWeight: 700,
      },
    ],
  })

  Font.register({
    family: 'Playfair Display',
    fonts: [
      {
        src: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd3vUDQZNLo_U2r.woff2',
        fontWeight: 700,
      },
    ],
  })

  Font.registerHyphenationCallback(word => [word])
}
