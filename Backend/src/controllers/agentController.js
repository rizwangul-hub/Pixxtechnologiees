const Agent = require('../models/Agent');
const Tenancy = require('../models/Tenancy');
const AgentPayment = require('../models/AgentPayment');
const AgentExpense = require('../models/AgentExpense');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');
const { generateMonthlyAgentSettlements } = require('../services/agentSettlementService');

// @desc    Create a new agent
// @route   POST /api/agents
// @access  Private
const createAgent = async (req, res) => {
  try {
    const { fullName, phone, email, address, country, region, notes, status } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Full name and contact number are required',
      });
    }

    let profileImage = '';
    let profileImagePublicId = '';

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'pixxtechnologies/agents');
      profileImage = uploadResult.url;
      profileImagePublicId = uploadResult.public_id;
    }

    const agent = await Agent.create({
      fullName,
      phone,
      email: email || '',
      address: address || '',
      country: country || '',
      region: region || '',
      notes: notes || '',
      status: status || 'Active',
      profileImage,
      profileImagePublicId,
    });

    res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      data: agent,
    });
  } catch (error) {
    console.error('[Create Agent Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create agent',
      errors: [error.message],
    });
  }
};

// @desc    Get all agents with search, filter, and metrics
// @route   GET /api/agents
// @access  Private
// @desc    Get all agents with search, filter, and metrics
const getAgents = async (req, res) => {
  try {
    await generateMonthlyAgentSettlements();

    const { search, region, status, archived, includeArchived, page = 1, limit = 100 } = req.query;

    const filter = {};

    if (archived === 'true' || status === 'Archived') {
      filter.isArchived = true;
    } else if (includeArchived === 'true') {
      // no isArchived constraint
    } else {
      filter.isArchived = { $ne: true };
      if (status) filter.status = status;
    }

    if (region) filter.region = { $regex: region, $options: 'i' };

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { region: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Agent.countDocuments(filter);
    const agents = await Agent.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const agentsWithMetrics = await Promise.all(
      agents.map(async (agent) => {
        const obj = agent.toObject();

        const activeTenancies = await Tenancy.find({
          agentId: agent._id,
          status: 'Active',
        });

        const assignedUnitsCount = activeTenancies.length;
        const monthlyAmount = activeTenancies.reduce((sum, t) => sum + (t.companyMonthlyAmount || 0), 0);

        const payments = await AgentPayment.find({ agentId: agent._id });
        const totalReceived = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
        const totalExpenses = payments.reduce((sum, p) => sum + (p.expenseAmount || 0), 0);
        const totalExpected = payments.reduce((sum, p) => sum + (p.expectedAmount || 0), 0);
        const totalNet = payments.reduce((sum, p) => sum + (p.netAmount || 0), 0);
        const totalPending = payments.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);

        return {
          ...obj,
          assignedUnitsCount,
          monthlyAmount,
          totalExpected,
          totalReceived,
          totalExpenses,
          netAmount: totalNet,
          totalPending,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Agents retrieved successfully',
      count: agentsWithMetrics.length,
      data: agentsWithMetrics,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error('[Get Agents Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agents',
      errors: [error.message],
    });
  }
};

// @desc    Get single agent by ID with complete breakdown
// @route   GET /api/agents/:id
// @access  Private
const getAgentById = async (req, res) => {
  try {
    await generateMonthlyAgentSettlements();

    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    // 1. Assigned Active Units / Tenancies
    const assignedTenancies = await Tenancy.find({
      agentId: agent._id,
      status: 'Active',
    })
      .populate('propertyId', 'propertyName name address type')
      
      .populate('customerId', 'fullName name phone email');

    const assignedUnitsCount = assignedTenancies.length;
    const monthlyCompanyAmount = assignedTenancies.reduce((sum, t) => sum + (t.companyMonthlyAmount || 0), 0);

    // 2. Financial Summary across all payments
    const payments = await AgentPayment.find({ agentId: agent._id });
    const totalExpected = payments.reduce((sum, p) => sum + (p.expectedAmount || 0), 0);
    const totalReceived = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const totalExpenses = payments.reduce((sum, p) => sum + (p.expenseAmount || 0), 0);
    const netAmount = payments.reduce((sum, p) => sum + (p.netAmount || 0), 0);
    const pendingAmount = payments.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);

    // 3. Recent Agent Payments
    const recentPayments = await AgentPayment.find({ agentId: agent._id })
      .populate('propertyId', 'propertyName name')
      
      .populate('tenantId', 'fullName name')
      .sort({ billingYear: -1, billingMonth: -1, createdAt: -1 })
      .limit(10);

    // 4. Recent Agent Expenses
    const recentExpenses = await AgentExpense.find({ agentId: agent._id })
      .populate('propertyId', 'propertyName name')
      
      .populate('tenantId', 'fullName name')
      .sort({ date: -1, createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      message: 'Agent details retrieved successfully',
      data: {
        agent,
        summary: {
          assignedUnitsCount,
          monthlyCompanyAmount,
          totalExpected,
          totalReceived,
          pendingAmount,
          totalExpenses,
          netAmount,
        },
        assignedTenancies,
        recentPayments,
        recentExpenses,
      },
    });
  } catch (error) {
    console.error('[Get Agent By ID Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent details',
      errors: [error.message],
    });
  }
};

// @desc    Update agent
// @route   PUT /api/agents/:id
// @access  Private
const updateAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    const { fullName, phone, email, address, country, region, notes, status } = req.body;

    if (fullName) agent.fullName = fullName;
    if (phone) agent.phone = phone;
    if (email !== undefined) agent.email = email;
    if (address !== undefined) agent.address = address;
    if (country !== undefined) agent.country = country;
    if (region !== undefined) agent.region = region;
    if (notes !== undefined) agent.notes = notes;
    if (status) agent.status = status;

    if (req.file) {
      if (agent.profileImagePublicId) {
        await deleteFromCloudinary(agent.profileImagePublicId).catch(() => {});
      }
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'pixxtechnologies/agents');
      agent.profileImage = uploadResult.url;
      agent.profileImagePublicId = uploadResult.public_id;
    }

    await agent.save();

    res.status(200).json({
      success: true,
      message: 'Agent updated successfully',
      data: agent,
    });
  } catch (error) {
    console.error('[Update Agent Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update agent',
      errors: [error.message],
    });
  }
};

// @desc    Archive / Soft Delete agent
// @route   DELETE /api/agents/:id or PUT /api/agents/:id/archive
// @access  Private
const archiveAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    // Check active tenancy assignment
    const activeTenancies = await Tenancy.find({
      agentId: agent._id,
      status: 'Active',
    });

    if (activeTenancies.length > 0) {
      return res.status(400).json({
        success: false,
        message: `This agent is assigned to ${activeTenancies.length} active tenancy/tenancies and cannot be archived until reassigned.`,
      });
    }

    agent.isArchived = true;
    agent.status = 'Archived';
    agent.archivedAt = new Date();
    agent.archivedBy = req.user?._id || null;
    agent.archiveReason = req.body?.reason || req.body?.archiveReason || 'Manager requested archival';
    await agent.save();

    res.status(200).json({
      success: true,
      message: 'Agent archived successfully.',
      data: agent,
    });
  } catch (error) {
    console.error('[Archive Agent Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to archive agent',
      errors: [error.message],
    });
  }
};

// @desc    Restore archived agent
// @route   PUT /api/agents/:id/restore
// @access  Private
const restoreAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }

    agent.isArchived = false;
    agent.status = 'Active';
    agent.archivedAt = null;
    agent.archivedBy = null;
    agent.archiveReason = '';
    await agent.save();

    res.status(200).json({
      success: true,
      message: 'Agent restored successfully.',
      data: agent,
    });
  } catch (error) {
    console.error('[Restore Agent Error]', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to restore agent',
      errors: [error.message],
    });
  }
};

module.exports = {
  createAgent,
  getAgents,
  getAgentById,
  updateAgent,
  deleteAgent: archiveAgent,
  archiveAgent,
  restoreAgent,
};
