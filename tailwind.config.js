/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme';
import colors from 'tailwindcss/colors';
import twThemer from 'tailwindcss-themer';
import twGradientMaskImage from 'tailwind-gradient-mask-image';

const brandColors = {
  orange: {
    aws: '#f90',
    awshover: '#ec7211',
  },
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      animation: {
        'error-shake': 'shake 500ms ease 1',
        'toast-enter': 'toastEnter 200ms ease-in',
        'toast-exit': 'toastLeave 200ms ease-in',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '16%': { transform: 'translateX(10px)' },
          '32%': { transform: 'translateX(-10px)' },
          '48%': { transform: 'translateX(4px)' },
          '64%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(2px)' },
          '96%': { transform: 'translateX(-2px)' },
        },
        fadeScale: {
          '0%': { opacity: '0', transform: 'scale(0.2)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        toastEnter: {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        toastLeave: {
          '0%': { transform: 'scale(1)', opacity: 1 },
          '100%': { transform: 'scale(0.9)', opacity: 0 },
        },
      },
    },
  },
  plugins: [
    twThemer({
      defaultTheme: {
        extend: {
          colors: {
            orange: brandColors.orange,
            primary: brandColors.orange.aws,
            primaryAlt: brandColors.orange.awshover,
            secondary: colors.neutral[500],
            secondaryAlt: colors.neutral[700],
            positive: colors.emerald[500],
            positiveAlt: colors.emerald[700],
            destruct: colors.red[500],
            destructAlt: colors.red[700],
            warn: colors.yellow[300],
            warnAlt: colors.yellow[500],
            uiText: colors.neutral[900],
            uiTextAlt: colors.neutral[100],
            surface: colors.white,
            surfaceAlt: colors.neutral[100],
            surfaceAlt2: colors.black,
            surfaceAlt3: colors.neutral[200],
            border: colors.neutral[200],
            overlay: colors.neutral[100],
          },
        },
      },
      themes: [
        {
          name: 'dark-theme',
          mediaQuery: '@media (prefers-color-scheme: dark)',
          extend: {
            colors: {
              primary: brandColors.orange.aws,
              primaryAlt: brandColors.orange.awshover,
              secondary: colors.neutral[500],
              secondaryAlt: colors.neutral[700],
              positive: colors.emerald[600],
              positiveAlt: colors.emerald[500],
              destruct: colors.red[600],
              destructAlt: colors.red[500],
              warn: colors.yellow[500],
              warnAlt: colors.yellow[400],
              uiText: colors.neutral[300],
              uiTextAlt: colors.neutral[700],
              surface: colors.black,
              surfaceAlt: colors.neutral[900],
              surfaceAlt2: colors.white,
              surfaceAlt3: colors.neutral[800],
              border: colors.neutral[800],
              overlay: colors.neutral[900],
            },
          },
        },
      ],
    }),
    twGradientMaskImage,
  ],
};
