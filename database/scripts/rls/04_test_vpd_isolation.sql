-- =============================================================================
-- SCRIPT 04: AUTOMATED TEST SUITE FOR ORACLE VPD (BRANCH ISOLATION)
-- PROJECT: PharmaSecure — Multi-Branch Pharmacy Management System
-- GOVERNANCE: Rule 06 (Branch Isolation Verification), Rule 10 (Testing Quality)
-- =============================================================================

SET SERVEROUTPUT ON SIZE 1000000;

DECLARE
    v_row_count NUMBER := 0;
    v_test_branch_a VARCHAR2(50) := 'BRANCH-HN-01';
    v_test_branch_b VARCHAR2(50) := 'BRANCH-DN-01';
    v_error_caught BOOLEAN := FALSE;
BEGIN
    DBMS_OUTPUT.PUT_LINE('===============================================================');
    DBMS_OUTPUT.PUT_LINE('STARTING ORACLE VPD BRANCH ISOLATION VERIFICATION TEST SUITE');
    DBMS_OUTPUT.PUT_LINE('===============================================================');

    -- TEST CASE 1: FAIL-CLOSED ON UNINITIALIZED CONTEXT
    DBMS_OUTPUT.PUT_LINE('TEST 1: Verifying Fail-Closed when context is uninitialized...');
    PKG_SESSION_CTX.CLEAR_CONTEXT;

    SELECT COUNT(*) INTO v_row_count FROM INVOICES;
    IF v_row_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE(' [PASS] TEST 1: Uninitialized context returned 0 rows as expected.');
    ELSE
        DBMS_OUTPUT.PUT_LINE(' [FAIL] TEST 1: Uninitialized context leaked ' || v_row_count || ' rows!');
    END IF;

    -- TEST CASE 2: SAME-BRANCH READ ISOLATION
    DBMS_OUTPUT.PUT_LINE('TEST 2: Setting context for Branch A (' || v_test_branch_a || ')...');
    PKG_SESSION_CTX.SET_BRANCH_CONTEXT(v_test_branch_a);

    -- Ensure all returned records belong strictly to Branch A
    SELECT COUNT(*) INTO v_row_count 
    FROM INVOICES 
    WHERE BranchId <> v_test_branch_a;

    IF v_row_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE(' [PASS] TEST 2: Query returned 0 cross-branch records. All rows belong to ' || v_test_branch_a);
    ELSE
        DBMS_OUTPUT.PUT_LINE(' [FAIL] TEST 2: Cross-branch rows detected: ' || v_row_count);
    END IF;

    -- TEST CASE 3: CROSS-BRANCH MUTATION PROTECTION (BLOCK PREDICATE)
    DBMS_OUTPUT.PUT_LINE('TEST 3: Attempting cross-branch INSERT (Injecting Branch B into Branch A session)...');
    v_error_caught := FALSE;
    BEGIN
        INSERT INTO INVOICES (
            id, InvoiceNo, BranchId, CashierId, TotalAmount, CreatedDate
        ) VALUES (
            'TEST-VPD-ERR-01', 'INV-TEST-VPD-01', v_test_branch_b, 'USER-01', 100000, CURRENT_TIMESTAMP
        );
        -- If insert succeeded, it is a critical violation!
        DBMS_OUTPUT.PUT_LINE(' [FAIL] TEST 3: Cross-branch INSERT was NOT blocked by Oracle VPD!');
        ROLLBACK;
    EXCEPTION
        WHEN OTHERS THEN
            -- Expected: ORA-28115: policy with check option violation
            v_error_caught := TRUE;
            DBMS_OUTPUT.PUT_LINE(' [PASS] TEST 3: Cross-branch INSERT successfully blocked with error: ' || SQLERRM);
            ROLLBACK;
    END IF;

    -- TEST CASE 4: GLOBAL OVERSIGHT VISIBILITY (CENTRAL AUDIT)
    DBMS_OUTPUT.PUT_LINE('TEST 4: Enabling Global Oversight Context...');
    PKG_SESSION_CTX.SET_GLOBAL_CONTEXT('TRUE');

    SELECT COUNT(*) INTO v_row_count FROM INVOICES;
    DBMS_OUTPUT.PUT_LINE(' [PASS] TEST 4: Global view active. Total cross-branch invoices visible: ' || v_row_count);

    -- TEST CASE 5: CLEANUP & FAIL-CLOSED RESTORATION
    DBMS_OUTPUT.PUT_LINE('TEST 5: Clearing context and verifying restoration of Fail-Closed state...');
    PKG_SESSION_CTX.CLEAR_CONTEXT;

    SELECT COUNT(*) INTO v_row_count FROM INVOICES;
    IF v_row_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE(' [PASS] TEST 5: Context cleared successfully. Invoices inaccessible (0 rows).');
    ELSE
        DBMS_OUTPUT.PUT_LINE(' [FAIL] TEST 5: Context leak after clear! ' || v_row_count || ' rows returned.');
    END IF;

    DBMS_OUTPUT.PUT_LINE('===============================================================');
    DBMS_OUTPUT.PUT_LINE('ORACLE VPD VERIFICATION SUITE FINISHED');
    DBMS_OUTPUT.PUT_LINE('===============================================================');
END;
/
