import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission, UserRole } from '@/lib/permissions'
import { UserUpdate } from '@/types'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    
    // Check permission to read users
    if (!hasPermission(userRole, 'USER_READ')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)
    
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    
    // Check permission to update users
    if (!hasPermission(userRole, 'USER_UPDATE')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, role } = body

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if trying to change role and has permission
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (role && role !== existingUser.role && !hasPermission(userRole, 'USER_CHANGE_ROLE')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to change user role' },
        { status: 403 }
      )
    }

    // Validate role if provided
    if (role && !['ADMIN', 'EDITOR', 'VIEWER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const updateData: UserUpdate = {}
    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(updatedUser)
    
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    
    // Check permission to delete users
    if (!hasPermission(userRole, 'USER_DELETE')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Prevent users from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        content: true,
        profiles: true
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete user and related data in a transaction
    await prisma.$transaction(async (tx: any) => {
      // Update content to remove references to this user
      await tx.content.updateMany({
        where: { lastEditorId: id },
        data: { lastEditorId: null }
      })

      // Delete profiles created by this user
      await tx.profile.deleteMany({
        where: { creatorId: id }
      })

      // Delete the user
      await tx.user.delete({
        where: { id }
      })
    })

    return NextResponse.json({ message: 'User deleted successfully' })
    
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}