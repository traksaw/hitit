/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Limewire-inspired green palette (original Hit.it colors)
				primary: {
					DEFAULT: '#79bf62', // dark-green
					light: '#deefd8', // light-green (background)
					medium: '#bcdfb1', // medium-green
					base: '#9bcf89', // green
					dark: '#79bf62', // dark-green
					deep: '#58af3b' // deep-green
				},
				// Keep accent green for highlights
				accent: {
					DEFAULT: '#58af3b',
					50: '#f0f9ed',
					100: '#deefd8',
					200: '#bcdfb1',
					300: '#9bcf89',
					400: '#79bf62',
					500: '#58af3b',
					600: '#468c2f',
					700: '#366a24',
					800: '#26491a',
					900: '#162811'
				}
			},
			fontFamily: {
				sans: [
					'Poppins',
					'system-ui',
					'-apple-system',
					'BlinkMacSystemFont',
					'Segoe UI',
					'Roboto',
					'sans-serif'
				]
			},
			boxShadow: {
				soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
				glow: '0 0 20px rgba(88, 175, 59, 0.3)',
				card: '0 6px 12px rgba(0, 0, 0, 0.15)'
			}
		}
	},
	plugins: []
};
