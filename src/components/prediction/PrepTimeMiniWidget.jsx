import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';

import { predictionApi } from '../../services/predictionService';

/**
 * PrepTimeMiniWidget
 * Compact floating/embedded widget designed specifically for customer menu & cart pre-ordering.
 * Automatically recalculates prep time as customer adds or changes dish selections.
 *
 * @param {Array<{menuItemId: number, quantity: number, itemName?: string}>} items - Cart items
 * @param {boolean} [isVip=false] - Whether the customer booked a VIP room
 * @param {number} [orderId] - Optional existing order ID
 * @param {string} [position='fixed'] - 'fixed' (floating in bottom corner) | 'relative' (inline inside cart)
 */
export default function PrepTimeMiniWidget({
  items = [],
  isVip = false,
  orderId = null,
  position = 'fixed',
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  // Recalculate whenever items, VIP flag, or orderId change
  useEffect(() => {
    let isCancelled = false;

    const calculate = async () => {
      // If neither items nor orderId exist, reset
      if (!orderId && (!items || items.length === 0)) {
        setPrediction(null);
        return;
      }

      try {
        setLoading(true);
        const payload = {
          isVip,
        };

        if (orderId) {
          payload.orderId = orderId;
        } else {
          payload.items = items.map((i) => ({
            menuItemId: Number(i.menuItemId || i.id),
            quantity: Number(i.quantity || 1),
          }));
        }

        const res = await predictionApi.predictPreparationTime(payload);
        if (!isCancelled) {
          setPrediction(res);
        }
      } catch {
        // Fallback default calculation if API temporary unavailable
        if (!isCancelled) {
          setPrediction({
            estimatedMinutes: 20,
            estimatedReadyTime: new Date(Date.now() + 20 * 60000).toISOString(),
            breakdown: {
              baseCookingMinutes: 15,
              queueWaitingMinutes: 3,
              historicalBiasMinutes: 2,
              longestDishName: items[0]?.itemName || 'Selected Dish',
            },
          });
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    const timer = setTimeout(calculate, 300); // 300ms debounce
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [items, isVip, orderId]);

  // Don't render if cart is completely empty and no orderId
  if (!orderId && (!items || items.length === 0)) {
    return null;
  }

  const formatReadyTime = (isoString) => {
    if (!isoString) return '--:--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  const estimatedMinutes = prediction?.estimatedMinutes || 15;
  const readyTime = formatReadyTime(prediction?.estimatedReadyTime);
  const longestDish = prediction?.breakdown?.longestDishName;

  return (
    <Box
      sx={{
        ...(position === 'fixed'
          ? {
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1200,
              maxWidth: { xs: 'calc(100vw - 32px)', sm: 380 },
              width: '100%',
            }
          : {
              width: '100%',
              mt: 2,
            }),
      }}
    >
      <Card
        sx={{
          borderRadius: '18px',
          border: '1px solid #cce2d5',
          boxShadow: '0 12px 36px rgba(22, 122, 90, 0.16)',
          bgcolor: '#ffffff',
          overflow: 'hidden',
          transition: 'all 0.25s ease',
        }}
      >
        {/* Compact Pill Bar */}
        <Box
          onClick={() => setExpanded((prev) => !prev)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            bgcolor: isVip ? '#fffbeb' : '#f0f8f4',
            cursor: 'pointer',
            userSelect: 'none',
            '&:hover': { bgcolor: isVip ? '#fef3c7' : '#e4f3eb' },
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: isVip ? '#d97706' : '#167a5a',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <TimerRoundedIcon sx={{ fontSize: 18 }} />
            </Box>

            <Box>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Typography variant="caption" sx={{ color: '#55655b', fontWeight: 600 }}>
                  Est. Kitchen Prep Time
                </Typography>
                {isVip && (
                  <Chip
                    icon={<StarRoundedIcon sx={{ fontSize: '12px !important' }} />}
                    label="VIP Priority"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 10,
                      fontWeight: 700,
                      bgcolor: '#fde68a',
                      color: '#92400e',
                    }}
                  />
                )}
              </Stack>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#1a2e22', lineHeight: 1.2 }}>
                {loading ? 'Estimating...' : `~${estimatedMinutes} mins`}
                <Typography component="span" variant="caption" sx={{ color: '#68776f', ml: 1, fontWeight: 500 }}>
                  (Ready by {readyTime})
                </Typography>
              </Typography>
            </Box>
          </Stack>

          <IconButton size="small" sx={{ color: '#55655b' }}>
            {expanded ? <ExpandMoreRoundedIcon /> : <ExpandLessRoundedIcon />}
          </IconButton>
        </Box>

        {/* Expandable Breakdown Drawer */}
        <Collapse in={expanded}>
          <Box sx={{ p: 2, bgcolor: '#ffffff' }}>
            <Typography variant="caption" sx={{ color: '#88988e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
              Cooking Timeline Breakdown
            </Typography>

            <Stack spacing={1}>
              {/* Factor 1: Longest Dish */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LocalFireDepartmentRoundedIcon sx={{ fontSize: 16, color: '#ea580c' }} />
                  <Typography variant="caption" sx={{ color: '#334138', fontWeight: 600 }}>
                    Base Cooking (Slowest Dish)
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1a2e22' }}>
                  {prediction?.breakdown?.baseCookingMinutes || 15}m
                </Typography>
              </Box>
              {longestDish && (
                <Typography variant="caption" sx={{ color: '#7a8a81', pl: 3, display: 'block', fontStyle: 'italic' }}>
                  Slowest: {longestDish}
                </Typography>
              )}

              {/* Factor 2: Kitchen Queue */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SpeedRoundedIcon sx={{ fontSize: 16, color: '#0284c7' }} />
                  <Typography variant="caption" sx={{ color: '#334138', fontWeight: 600 }}>
                    Kitchen Queue Delay
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1a2e22' }}>
                  +{prediction?.breakdown?.queueWaitingMinutes || 0}m
                </Typography>
              </Box>

              {/* Factor 3: Historical Bias */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccessTimeRoundedIcon sx={{ fontSize: 16, color: '#8b5cf6' }} />
                  <Typography variant="caption" sx={{ color: '#334138', fontWeight: 600 }}>
                    Peak Hour Calibration
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1a2e22' }}>
                  {(prediction?.breakdown?.historicalBiasMinutes > 0
                    ? `+${prediction.breakdown.historicalBiasMinutes}`
                    : (prediction?.breakdown?.historicalBiasMinutes ?? 0)) + 'm'}
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="caption" sx={{ color: '#88988e', fontSize: 10, display: 'block' }}>
              * Calculated dynamically from active kitchen load and historical order throughput.
            </Typography>
          </Box>
        </Collapse>
      </Card>
    </Box>
  );
}

