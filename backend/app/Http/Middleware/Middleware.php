<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if ($user) {
            if ($user->tenant_id) {
                config(['app.tenant_id' => $user->tenant_id]);
            }
        }

        return $next($request);
    }
}

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        if (!$user->hasPermission($permission)) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. You do not have permission to perform this action.',
            ], 403);
        }

        return $next($request);
    }
}

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTenantStatus
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return $next($request);
        }

        if (!$user->tenant) {
            return $next($request);
        }

        if ($user->tenant->status === 'suspended') {
            return response()->json([
                'success' => false,
                'message' => 'Your company account has been suspended. Please contact support.',
            ], 403);
        }

        if ($user->tenant->status === 'expired') {
            return response()->json([
                'success' => false,
                'message' => 'Your subscription has expired. Please renew to continue using the system.',
            ], 403);
        }

        if ($user->tenant->isTrial() && $user->tenant->trialExpired()) {
            $user->tenant->update(['status' => 'expired']);
            return response()->json([
                'success' => false,
                'message' => 'Your trial period has ended. Please subscribe to continue using the system.',
            ], 403);
        }

        return $next($request);
    }
}

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class ThrottleRequests
{
    /**
     * Handle rate limiting.
     */
    public function handle(Request $request, \Closure $next, int $maxAttempts = 60, int $decayMinutes = 1): Response
    {
        $key = 'api:' . $request->ip();
        
        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            return response()->json([
                'success' => false,
                'message' => 'Too many requests. Please try again later.',
                'retry_after' => RateLimiter::availableIn($key),
            ], 429);
        }

        RateLimiter::hit($key, $decayMinutes * 60);

        $response = $next($request);

        return $response->withHeaders([
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => RateLimiter::remaining($key, $maxAttempts),
        ]);
    }
}

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceJsonResponse
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');
        
        return $next($request);
    }
}

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditActivity
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $method = strtoupper($request->method());
        
        if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $user = $request->user();
            
            if ($user) {
                activity()
                    ->causedBy($user)
                    ->withProperties([
                        'ip' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                        'method' => $method,
                        'path' => $request->path(),
                    ])
                    ->log("API: {$method} {$request->path()}");
            }
        }

        return $response;
    }
}