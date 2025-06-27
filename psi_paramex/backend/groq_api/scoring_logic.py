from typing import Dict, Any, List, Tuple
import re

class ProjectScorer:
    """
    Advanced scoring logic for project analysis and recommendations
    """
    
    def __init__(self):
        # Complexity scoring weights
        self.complexity_weights = {
            "timeline": 0.25,
            "budget": 0.20,
            "technical_complexity": 0.30,
            "client_experience": 0.15,
            "team_size": 0.10
        }
        
        # Risk factor mapping
        self.risk_factors = {
            "tight_timeline": {"weight": 0.3, "description": "Timeline pressure"},
            "low_budget": {"weight": 0.25, "description": "Budget constraints"},
            "new_technology": {"weight": 0.2, "description": "Technology learning curve"},
            "difficult_client": {"weight": 0.15, "description": "Client management challenges"},
            "scope_uncertainty": {"weight": 0.1, "description": "Unclear requirements"}
        }
    
    def analyze_project_complexity(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze project complexity and return detailed scoring
        """
        scores = {}
        
        # Timeline complexity
        timeline = project_data.get('timeline', '').lower()
        if 'week' in timeline or 'urgent' in timeline:
            scores['timeline'] = 9  # High complexity
        elif 'month' in timeline and ('1' in timeline or '2' in timeline):
            scores['timeline'] = 7  # Medium-high
        elif 'month' in timeline:
            scores['timeline'] = 5  # Medium
        else:
            scores['timeline'] = 3  # Low
        
        # Budget complexity
        budget_str = project_data.get('budget', '').lower()
        budget_amount = self._extract_budget_amount(budget_str)
        
        if budget_amount:
            if budget_amount < 5000:
                scores['budget'] = 8  # High complexity (tight budget)
            elif budget_amount < 15000:
                scores['budget'] = 6  # Medium
            elif budget_amount < 50000:
                scores['budget'] = 4  # Low-medium
            else:
                scores['budget'] = 2  # Low
        else:
            scores['budget'] = 5  # Unknown/medium
        
        # Technical complexity based on description
        description = project_data.get('description', '').lower()
        tech_keywords = {
            'ai': 3, 'machine learning': 3, 'blockchain': 3,
            'real-time': 2, 'api': 2, 'database': 2,
            'mobile app': 2, 'web app': 1, 'website': 1
        }
        
        tech_score = 1
        for keyword, weight in tech_keywords.items():
            if keyword in description:
                tech_score += weight
        
        scores['technical_complexity'] = min(tech_score, 10)
        
        # Client experience factor
        client_type = project_data.get('client_type', '').lower()
        if 'new' in client_type or 'first time' in client_type:
            scores['client_experience'] = 7
        elif 'small business' in client_type:
            scores['client_experience'] = 5
        elif 'enterprise' in client_type or 'corporate' in client_type:
            scores['client_experience'] = 6
        else:
            scores['client_experience'] = 4
        
        # Overall complexity score
        weighted_score = sum(
            scores.get(factor, 5) * weight 
            for factor, weight in self.complexity_weights.items()
        )
        
        return {
            "individual_scores": scores,
            "overall_complexity": round(weighted_score, 1),
            "complexity_level": self._get_complexity_level(weighted_score),
            "recommendations": self._get_complexity_recommendations(weighted_score, scores)
        }
    
    def assess_project_risks(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assess potential risks in the project
        """
        risks = []
        risk_score = 0
        
        # Timeline risk
        timeline = project_data.get('timeline', '').lower()
        if any(word in timeline for word in ['urgent', 'asap', 'week', '1 month']):
            risks.append({
                "type": "tight_timeline",
                "severity": "high",
                "description": "Very tight timeline may lead to quality compromises",
                "mitigation": "Consider negotiating timeline or reducing scope"
            })
            risk_score += 3
        
        # Budget risk
        budget_str = project_data.get('budget', '').lower()
        if 'low' in budget_str or 'cheap' in budget_str or self._extract_budget_amount(budget_str) and self._extract_budget_amount(budget_str) < 3000:
            risks.append({
                "type": "low_budget",
                "severity": "medium",
                "description": "Low budget may not cover all requirements adequately",
                "mitigation": "Clearly define scope boundaries and payment milestones"
            })
            risk_score += 2
        
        # Scope risk
        description = project_data.get('description', '').lower()
        if len(description) < 50 or 'flexible' in description or 'we\'ll figure out' in description:
            risks.append({
                "type": "scope_uncertainty",
                "severity": "medium",
                "description": "Unclear or vague requirements may lead to scope creep",
                "mitigation": "Conduct detailed requirements gathering session"
            })
            risk_score += 2
        
        # Technology risk
        if any(tech in description for tech in ['new technology', 'latest', 'cutting edge', 'experimental']):
            risks.append({
                "type": "new_technology",
                "severity": "medium",
                "description": "New technology adoption may involve learning curve",
                "mitigation": "Allocate extra time for research and experimentation"
            })
            risk_score += 2
        
        return {
            "risks": risks,
            "overall_risk_score": risk_score,
            "risk_level": self._get_risk_level(risk_score),
            "total_risks": len(risks)
        }
    
    def generate_pricing_recommendation(self, project_data: Dict[str, Any], complexity_score: float) -> Dict[str, Any]:
        """
        Generate pricing recommendations based on complexity and other factors
        """
        base_hourly_rate = 75  # Base rate in USD
        
        # Adjust rate based on complexity
        complexity_multiplier = 1 + (complexity_score - 5) * 0.1
        adjusted_rate = base_hourly_rate * complexity_multiplier
        
        # Estimate hours based on project type and complexity
        description = project_data.get('description', '').lower()
        
        if 'website' in description:
            base_hours = 40 if 'simple' in description else 80
        elif 'web app' in description:
            base_hours = 120 if 'simple' in description else 200
        elif 'mobile app' in description:
            base_hours = 160 if 'simple' in description else 300
        else:
            base_hours = 60  # Default
        
        # Adjust hours based on complexity
        estimated_hours = base_hours * (1 + (complexity_score - 5) * 0.15)
        
        total_estimate = adjusted_rate * estimated_hours
        
        return {
            "hourly_rate_recommendation": round(adjusted_rate, 2),
            "estimated_hours": round(estimated_hours),
            "total_project_estimate": round(total_estimate),
            "pricing_strategy": self._get_pricing_strategy(complexity_score),
            "payment_terms": self._get_payment_terms(total_estimate)
        }
    
    def _extract_budget_amount(self, budget_str: str) -> float:
        """Extract numeric budget amount from string"""
        if not budget_str:
            return 0
        
        # Remove currency symbols and extract numbers
        numbers = re.findall(r'[\d,]+', budget_str.replace(',', ''))
        if numbers:
            try:
                return float(numbers[0])
            except ValueError:
                return 0
        return 0
    
    def _get_complexity_level(self, score: float) -> str:
        """Convert numeric complexity score to level"""
        if score >= 8:
            return "Very High"
        elif score >= 6:
            return "High"
        elif score >= 4:
            return "Medium"
        elif score >= 2:
            return "Low"
        else:
            return "Very Low"
    
    def _get_risk_level(self, score: int) -> str:
        """Convert numeric risk score to level"""
        if score >= 6:
            return "High Risk"
        elif score >= 3:
            return "Medium Risk"
        else:
            return "Low Risk"
    
    def _get_complexity_recommendations(self, score: float, individual_scores: Dict) -> List[str]:
        """Generate recommendations based on complexity analysis"""
        recommendations = []
        
        if score >= 7:
            recommendations.append("Consider breaking this project into smaller phases")
            recommendations.append("Allocate extra buffer time for unexpected challenges")
            recommendations.append("Require detailed project documentation upfront")
        
        if individual_scores.get('timeline', 0) >= 7:
            recommendations.append("Negotiate timeline or reduce scope to maintain quality")
        
        if individual_scores.get('budget', 0) >= 7:
            recommendations.append("Clearly define what's included/excluded to avoid scope creep")
        
        if individual_scores.get('technical_complexity', 0) >= 7:
            recommendations.append("Conduct technical feasibility study before committing")
        
        return recommendations
    
    def _get_pricing_strategy(self, complexity_score: float) -> str:
        """Recommend pricing strategy based on complexity"""
        if complexity_score >= 7:
            return "Fixed price with detailed scope (higher rate due to complexity)"
        elif complexity_score >= 5:
            return "Hybrid: Fixed price for core features, hourly for additions"
        else:
            return "Fixed price acceptable for well-defined projects"
    
    def _get_payment_terms(self, total_estimate: float) -> List[str]:
        """Recommend payment terms based on project size"""
        terms = []
        
        if total_estimate >= 10000:
            terms.append("50% upfront, 25% at milestone, 25% on completion")
            terms.append("Consider requiring deposit before starting")
        elif total_estimate >= 5000:
            terms.append("30% upfront, 40% at milestone, 30% on completion")
        else:
            terms.append("50% upfront, 50% on completion")
        
        terms.append("Include kill fee clause for early termination")
        terms.append("Net 15 payment terms for invoices")
        
        return terms

# Global instance
project_scorer = ProjectScorer()
