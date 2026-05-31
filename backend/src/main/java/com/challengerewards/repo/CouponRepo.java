package com.challengerewards.repo;

import com.challengerewards.domain.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRepo extends JpaRepository<Coupon, String> {}
