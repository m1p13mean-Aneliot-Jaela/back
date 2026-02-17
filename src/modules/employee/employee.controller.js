const employeeService = require('./employee.service');
const { catchAsync } = require('../../shared/errors/custom-errors');

class EmployeeController {
  // Create new employee
  createEmployee = catchAsync(async (req, res) => {
    // Force shop_id from URL param - employee can ONLY be created for the shop in the URL
    const { shop_id, ...bodyData } = req.body;
    const employeeData = {
      ...bodyData,
      shop_id: req.params.shopId  // Always use shopId from URL, ignore body
    };

    const updaterInfo = req.user ? {
      user_id: req.user._id,
      first_name: req.user.first_name,
      last_name: req.user.last_name
    } : null;

    const employee = await employeeService.createEmployee(employeeData, updaterInfo);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  });

  // Get all employees by shop
  getEmployeesByShop = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const { page = 1, limit = 10, role, active, search } = req.query;

    const filters = {};
    if (role) filters.role = role;
    if (active !== undefined) filters.active = active === 'true';
    if (search) {
      filters.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const result = await employeeService.getEmployeesByShop(shopId, filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result
    });
  });

  // Get employee by ID
  getEmployeeById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const employee = await employeeService.getEmployeeById(id);

    res.json({
      success: true,
      data: employee
    });
  });

  // Update employee
  updateEmployee = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const updaterInfo = req.user ? {
      user_id: req.user._id,
      first_name: req.user.first_name,
      last_name: req.user.last_name
    } : null;

    const employee = await employeeService.updateEmployee(id, updateData, updaterInfo);

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  });

  // Update employee status (active/inactive)
  updateStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { active } = req.body;

    const updaterInfo = req.user ? {
      user_id: req.user._id,
      first_name: req.user.first_name,
      last_name: req.user.last_name
    } : null;

    const employee = await employeeService.updateEmployeeStatus(id, active, updaterInfo);

    res.json({
      success: true,
      message: `Employee ${active ? 'activated' : 'deactivated'} successfully`,
      data: employee
    });
  });

  // Delete employee
  deleteEmployee = catchAsync(async (req, res) => {
    const { id } = req.params;
    await employeeService.deleteEmployee(id);

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  });

  // Get employee stats
  getEmployeeStats = catchAsync(async (req, res) => {
    const { shopId } = req.params;
    const stats = await employeeService.getEmployeeStats(shopId);

    res.json({
      success: true,
      data: stats
    });
  });

  // Get employee permissions
  getEmployeePermissions = catchAsync(async (req, res) => {
    const { id } = req.params;
    const employee = await employeeService.getEmployeeById(id);
    const permissions = employeeService.getPermissions(employee.role);

    res.json({
      success: true,
      data: {
        employee_id: id,
        role: employee.role,
        permissions
      }
    });
  });

  // Check specific permission
  checkPermission = catchAsync(async (req, res) => {
    const { id, permission } = req.params;
    const hasPermission = await employeeService.checkPermission(id, permission);

    res.json({
      success: true,
      data: {
        employee_id: id,
        permission,
        granted: hasPermission
      }
    });
  });
}

module.exports = new EmployeeController();
