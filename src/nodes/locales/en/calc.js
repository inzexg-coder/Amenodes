export default {
  nodes: {
    calc: 'Error Propagation'
  },
  nodeDescriptions: {
    calc: 'Node for calculating measurement errors and uncertainties'
  },
  calcTypes: {
    div3: 'Divide by 3 (Δ/3)',
    div_sqrt12: 'Divide by √12 (ω/√12)',
    sqrt_sum_sq: '√(a² + b²) Pairwise',
    quadratic_sum: 'Quadratic Sum √(Σσ²)',
    multiply_by_constant: 'Multiply by Constant',
    result: 'Result',
    inputs: 'Inputs'
  },
  dataTypes: {
    uncert: 'Uncertainty'
  }
};
