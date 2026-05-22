<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Tenant;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * Register a new user
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'first_name' => 'required|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'first_name_ar' => 'nullable|string|max:100',
            'last_name_ar' => 'nullable|string|max:100',
            'phone' => 'required|string|max:50',
            'tenant_id' => 'nullable|uuid|exists:tenants,id',
            'role_id' => 'nullable|uuid|exists:roles,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'email' => $request->email,
            'password' => $request->password,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'first_name_ar' => $request->first_name_ar,
            'last_name_ar' => $request->last_name_ar,
            'phone' => $request->phone,
            'tenant_id' => $request->tenant_id,
            'role_id' => $request->role_id ?? $this->getDefaultRoleId($request->tenant_id),
            'status' => 'active',
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'data' => [
                'user' => $user,
                'token' => $token,
                'token_type' => 'bearer',
                'expires_in' => config('jwt.ttl') * 60,
            ],
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        try {
            if (!$token = JWTAuth::attempt($credentials)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials',
                ], 401);
            }
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not create token',
            ], 500);
        }

        $user = auth()->user();
        
        if ($user->status !== 'active') {
            JWTAuth::invalidate(JWTAuth::getToken());
            return response()->json([
                'success' => false,
                'message' => 'Account is not active',
            ], 403);
        }

        $user->updateLastLogin();

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => $user->load(['tenant', 'role']),
                'token' => $token,
                'token_type' => 'bearer',
                'expires_in' => config('jwt.ttl') * 60,
            ],
        ]);
    }

    /**
     * Get current authenticated user
     */
    public function me(): JsonResponse
    {
        $user = auth()->user();

        return response()->json([
            'success' => true,
            'data' => $user->load([
                'tenant',
                'role',
            ]),
        ]);
    }

    /**
     * Logout user
     */
    public function logout(): JsonResponse
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
            return response()->json([
                'success' => true,
                'message' => 'Successfully logged out',
            ]);
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to logout',
            ], 500);
        }
    }

    /**
     * Refresh token
     */
    public function refresh(): JsonResponse
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());
            return response()->json([
                'success' => true,
                'data' => [
                    'token' => $token,
                    'token_type' => 'bearer',
                    'expires_in' => config('jwt.ttl') * 60,
                ],
            ]);
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not refresh token',
            ], 401);
        }
    }

    /**
     * Change password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed|different:current_password',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = auth()->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect',
            ], 400);
        }

        $user->update(['password' => $request->password]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully',
        ]);
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|string|max:100',
            'last_name' => 'sometimes|string|max:100',
            'first_name_ar' => 'sometimes|string|max:100',
            'last_name_ar' => 'sometimes|string|max:100',
            'phone' => 'sometimes|string|max:50',
            'date_of_birth' => 'sometimes|date',
            'gender' => 'sometimes|string|in:male,female',
            'nationality' => 'sometimes|string|max:100',
            'address' => 'sometimes|string',
            'avatar_url' => 'sometimes|url',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user->update($request->only([
            'first_name', 'last_name', 'first_name_ar', 'last_name_ar',
            'phone', 'date_of_birth', 'gender', 'nationality', 'address', 'avatar_url',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $user,
        ]);
    }

    /**
     * Create tenant and owner account
     */
    public function createTenantWithOwner(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'tenant.name_ar' => 'required|string|max:255',
            'tenant.name_en' => 'nullable|string|max:255',
            'tenant.code' => 'required|string|max:50|unique:tenants,code',
            'tenant.email' => 'required|email',
            'tenant.phone' => 'required|string|max:50',
            'tenant.country' => 'sometimes|string|max:100',
            'owner.email' => 'required|email|unique:users,email',
            'owner.password' => 'required|string|min:8',
            'owner.first_name' => 'required|string|max:100',
            'owner.last_name' => 'nullable|string|max:100',
            'owner.phone' => 'required|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $tenantData = $request->tenant;
        $ownerData = $request->owner;

        $tenant = Tenant::create([
            'name_ar' => $tenantData['name_ar'],
            'name_en' => $tenantData['name_en'] ?? null,
            'code' => $tenantData['code'],
            'email' => $tenantData['email'],
            'phone' => $tenantData['phone'],
            'country' => $tenantData['country'] ?? 'SA',
            'status' => 'trial',
            'trial_ends_at' => now()->addDays(14),
        ]);

        $ownerRole = Role::where('name', 'owner')->first();

        $owner = User::create([
            'tenant_id' => $tenant->id,
            'role_id' => $ownerRole?->id,
            'email' => $ownerData['email'],
            'password' => $ownerData['password'],
            'first_name' => $ownerData['first_name'],
            'last_name' => $ownerData['last_name'] ?? null,
            'phone' => $ownerData['phone'],
            'status' => 'active',
        ]);

        $token = JWTAuth::fromUser($owner);

        return response()->json([
            'success' => true,
            'message' => 'Tenant and owner created successfully',
            'data' => [
                'tenant' => $tenant,
                'owner' => $owner,
                'token' => $token,
                'token_type' => 'bearer',
                'expires_in' => config('jwt.ttl') * 60,
            ],
        ], 201);
    }

    protected function getDefaultRoleId(?string $tenantId): ?string
    {
        if (!$tenantId) {
            return Role::where('name', 'super_admin')->first()?->id;
        }
        return Role::where('name', 'owner')->where('tenant_id', $tenantId)->first()?->id;
    }
}