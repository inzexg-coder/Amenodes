export const SYMBOL_MAP = {
  $alpha:'α', $beta:'β', $gamma:'γ', $delta:'δ', $epsilon:'ε',
  $zeta:'ζ', $eta:'η', $theta:'θ', $iota:'ι', $kappa:'κ',
  $lambda:'λ', $mu:'μ', $nu:'ν', $xi:'ξ', $omicron:'ο',
  $pi:'π', $rho:'ρ', $sigma:'σ', $tau:'τ', $upsilon:'υ',
  $phi:'φ', $chi:'χ', $psi:'ψ', $omega:'ω',
  $Alpha:'Α', $Beta:'Β', $Gamma:'Γ', $Delta:'Δ', $Epsilon:'Ε',
  $Zeta:'Ζ', $Eta:'Η', $Theta:'Θ', $Iota:'Ι', $Kappa:'Κ',
  $Lambda:'Λ', $Mu:'Μ', $Nu:'Ν', $Xi:'Ξ', $Omicron:'Ο',
  $Pi:'Π', $Rho:'Ρ', $Sigma:'Σ', $Tau:'Τ', $Upsilon:'Υ',
  $Phi:'Φ', $Chi:'Χ', $Psi:'Ψ', $Omega:'Ω',
  $e:'e', $inf:'∞', $sqrt:'√', $sum:'∑', $int:'∫',
  $partial:'∂', $nabla:'∇', $in:'∈', $notin:'∉', $subset:'⊂',
  $supset:'⊃', $union:'∪', $intersect:'∩', $emptyset:'∅',
  $degree:'°', $plusmn:'±', $times:'×', $div:'÷',
  $leq:'≤', $geq:'≥', $neq:'≠', $approx:'≈'
};

export function replaceSymbols(s) {
  if (!s || typeof s !== 'string') return s;
  return s.replace(/\$[a-zA-Z]+/g, function(match) {
    return SYMBOL_MAP[match] || match;
  });
}
