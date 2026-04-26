const bcrypt = require("bcrypt");
const prisma = require("../../config/prisma");
const cache = require("../../utils/cache");
const ApiError = require("../../utils/apiError");

async function getProfile(userId) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      email_verified: true,
      is_active: true,
      created_at: true
    }
  });

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  return user;
}

async function updateProfile(userId, payload) {
  if (Object.keys(payload).length === 0) {
    return getProfile(userId);
  }

  await prisma.users.update({
    where: { id: userId },
    data: {
      ...payload,
      updated_at: new Date()
    }
  });
  return getProfile(userId);
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { password_hash: true }
  });
  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) {
    throw new ApiError(400, "Incorrect current password", "INVALID_PASSWORD");
  }

  const password_hash = await bcrypt.hash(newPassword, 12);

  await prisma.users.update({
    where: { id: userId },
    data: {
      password_hash,
      updated_at: new Date()
    }
  });

  if (cache) {
    await cache.del(`refresh:${userId}`);
  }
}

async function getAddresses(userId) {
  return prisma.addresses.findMany({
    where: { user_id: userId },
    orderBy: [
      { is_default: "desc" },
      { created_at: "desc" }
    ]
  });
}

async function addAddress(userId, payload) {
  return prisma.$transaction(async (tx) => {
    if (payload.is_default) {
      await tx.addresses.updateMany({
        where: { user_id: userId },
        data: { is_default: false }
      });
    }

    return tx.addresses.create({
      data: {
        user_id: userId,
        ...payload
      }
    });
  });
}

async function updateAddress(userId, addressId, payload) {
  return prisma.$transaction(async (tx) => {
    const address = await tx.addresses.findFirst({
      where: { id: addressId, user_id: userId }
    });
    if (!address) {
      throw new ApiError(403, "Address not found or unauthorized", "FORBIDDEN");
    }

    if (payload.is_default) {
      await tx.addresses.updateMany({
        where: { user_id: userId },
        data: { is_default: false }
      });
    }

    return tx.addresses.update({
      where: { id: addressId },
      data: { 
        ...payload, 
        updated_at: new Date() 
      }
    });
  });
}

async function deleteAddress(userId, addressId) {
  const address = await prisma.addresses.findFirst({
    where: { id: addressId, user_id: userId }
  });
  if (!address) {
    throw new ApiError(403, "Address not found or unauthorized", "FORBIDDEN");
  }

  try {
    await prisma.addresses.delete({
      where: { id: addressId }
    });
  } catch (err) {
    // Prisma Foreign Key violation error code for Postgres
    if (err.code === "P2003") {
      throw new ApiError(422, "Cannot delete address because it is referenced by an order", "ADDRESS_REFERENCED");
    }
    throw err;
  }
}

async function listUsers(query) {
  const { page, limit, role } = query;
  const skip = (page - 1) * limit;

  const where = {};
  if (role) {
    where.role = role;
  }

  const [total, users] = await prisma.$transaction([
    prisma.users.count({ where }),
    prisma.users.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        email_verified: true,
        is_active: true,
        created_at: true
      },
      orderBy: { created_at: "desc" },
      take: limit,
      skip
    })
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limit)
    }
  };
}

async function getUserDetails(userId) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      email_verified: true,
      is_active: true,
      created_at: true,
      _count: {
        select: { orders: true }
      }
    }
  });

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  // Map _count.orders to order_count for compatibility
  const result = { ...user, order_count: user._count.orders };
  delete result._count;

  return result;
}

async function updateUserStatus(userId, isActive) {
  try {
    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        is_active: isActive,
        updated_at: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        is_active: true,
        role: true
      }
    });

    return user;
  } catch (err) {
    if (err.code === "P2025") {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }
    throw err;
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  listUsers,
  getUserDetails,
  updateUserStatus
};
